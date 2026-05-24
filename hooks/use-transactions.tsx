// Context กลางที่ดึงข้อมูลรายการเงินเข้า/ออก + ฟัง Realtime
// ใช้ร่วมกันทั้ง 3 หน้า (Home / เงินเข้า / เงินออก) เพื่อให้ยอดตรงกันแบบเรียลไทม์

import React from "react";

import { supabase } from "../services/supabase";
import { Transaction } from "../types";

// เรียงล่าสุดขึ้นก่อน (ตามวันที่ แล้วตามเวลาที่สร้าง)
const sortTx = (list: Transaction[]): Transaction[] =>
  [...list].sort((a, b) => {
    if (a.tx_date !== b.tx_date) {
      return a.tx_date < b.tx_date ? 1 : -1;
    }

    return a.created_at < b.created_at ? 1 : -1;
  });

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  refetch: () => Promise<void>;
};

const TransactionsContext = React.createContext<TransactionsContextValue | null>(
  null,
);

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  // ดึงข้อมูลทั้งหมด
  const refetch = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  // ฟังการเปลี่ยนแปลงแบบ Realtime
  React.useEffect(() => {
    // ตั้งชื่อ channel ไม่ซ้ำทุกครั้งที่ mount กันชนกับ channel เก่าที่ยังถอนไม่เสร็จ
    // (เช่น ตอน logout แล้ว login ใหม่)
    const channel = supabase
      .channel(`transactions-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          setTransactions((prev) => {
            const incoming = payload.new as Transaction;

            if (prev.some((t) => t.id === incoming.id)) {
              return prev;
            }

            return sortTx([incoming, ...prev]);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions" },
        (payload) => {
          const updated = payload.new as Transaction;

          setTransactions((prev) =>
            sortTx(prev.map((t) => (t.id === updated.id ? updated : t))),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "transactions" },
        (payload) => {
          const removed = payload.old as Transaction;

          setTransactions((prev) => prev.filter((t) => t.id !== removed.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // คำนวณยอดรวม (คิดใหม่เฉพาะตอน transactions เปลี่ยน)
  const { totalIncome, totalExpense, balance } = React.useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions]);

  const value = React.useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      loading,
      totalIncome,
      totalExpense,
      balance,
      refetch,
    }),
    [transactions, loading, totalIncome, totalExpense, balance, refetch],
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions(): TransactionsContextValue {
  const ctx = React.useContext(TransactionsContext);

  if (!ctx) {
    throw new Error("useTransactions ต้องอยู่ภายใน TransactionsProvider");
  }

  return ctx;
}
