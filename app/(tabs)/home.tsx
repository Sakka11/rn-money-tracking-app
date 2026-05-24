import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BalanceHeader from "../../components/balance-header";
import { Colors } from "../../constants/theme";
import { useTransactions } from "../../hooks/use-transactions";
import { formatMoney, formatThaiDate } from "../../services/datetime";
import { Transaction } from "../../types";

export default function HomeScreen() {
  const { transactions, loading, refetch } = useTransactions();

  const openDetail = (item: Transaction) => {
    router.push({
      pathname: "/[id]",
      params: {
        id: item.id,
        detail: item.detail,
        amount: String(item.amount),
        type: item.type,
        tx_date: item.tx_date,
        image_url: item.image_url ?? "",
      },
    });
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === "income";
    const accent = isIncome ? Colors.income : Colors.expense;

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => openDetail(item)}
      >
        <View style={[styles.rowIcon, { backgroundColor: accent }]}>
          <Ionicons
            name={isIncome ? "arrow-down" : "arrow-up"}
            size={18}
            color="#fff"
          />
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.rowDetail} numberOfLines={1}>
            {item.detail}
          </Text>

          <Text style={styles.rowDate}>{formatThaiDate(item.tx_date)}</Text>
        </View>

        <Text style={[styles.rowAmount, { color: accent }]}>
          {formatMoney(Number(item.amount))}
        </Text>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View>
      <BalanceHeader />

      <Text style={styles.sectionTitle}>เงินเข้า/เงินออก</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingBox}>
          <BalanceHeader />

          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={48} color="#c4cbd4" />
              <Text style={styles.emptyText}>ยังไม่มีรายการ</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              onRefresh={refetch}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  loadingBox: {
    flex: 1,
  },

  loadingInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontFamily: "Kanit_400Regular",
    color: Colors.textMuted,
    marginTop: 12,
  },

  sectionTitle: {
    fontFamily: "Kanit_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  rowBody: {
    flex: 1,
    marginLeft: 14,
  },

  rowDetail: {
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: Colors.text,
  },

  rowDate: {
    fontFamily: "Kanit_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },

  rowAmount: {
    fontFamily: "Kanit_700Bold",
    fontSize: 18,
    marginLeft: 10,
  },

  separator: {
    height: 1,
    backgroundColor: "#eef1f4",
    marginHorizontal: 20,
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },

  emptyText: {
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: Colors.textMuted,
  },
});
