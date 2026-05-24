export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  detail: string;
  amount: number;
  type: TxType;
  tx_date: string;
  image_url: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};
