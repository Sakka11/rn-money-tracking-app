import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";
import { useProfile } from "../hooks/use-profile";
import { useTransactions } from "../hooks/use-transactions";
import { formatMoney } from "../services/datetime";

export default function BalanceHeader() {
  const insets = useSafeAreaInsets();
  const { totalIncome, totalExpense, balance } = useTransactions();
  const { profile } = useProfile();

  const name = profile?.display_name?.trim() || "ตั้งค่าโปรไฟล์";

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      {/* แถวโปรไฟล์ (กดเพื่อแก้ไข) */}
      <TouchableOpacity
        style={styles.profileRow}
        activeOpacity={0.8}
        onPress={() => router.push("/profile")}
      >
        <View style={styles.nameWrap}>
          <Text style={styles.profileName} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.editHint}>
            <Ionicons name="create-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.editHintText}>แตะเพื่อแก้ไข</Text>
          </View>
        </View>

        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={24} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      {/* การ์ดยอดเงิน */}
      <View style={styles.card}>
        <Text style={styles.balanceLabel}>ยอดเงินคงเหลือ</Text>

        <Text style={styles.balanceValue}>{formatMoney(balance)}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="arrow-down" size={12} color="#fff" />
              </View>

              <Text style={styles.summaryLabel}>ยอดเงินเข้ารวม</Text>
            </View>

            <Text style={styles.summaryValue}>{formatMoney(totalIncome)}</Text>
          </View>

          <View style={styles.summaryItemRight}>
            <View style={styles.summaryLabelRowRight}>
              <Text style={styles.summaryLabel}>ยอดเงินออกรวม</Text>

              <View style={styles.iconCircle}>
                <Ionicons name="arrow-up" size={12} color="#fff" />
              </View>
            </View>

            <Text style={styles.summaryValue}>{formatMoney(totalExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  nameWrap: {
    flex: 1,
    marginRight: 12,
  },

  profileName: {
    fontFamily: "Kanit_700Bold",
    fontSize: 18,
    color: "#fff",
  },

  editHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },

  editHintText: {
    fontFamily: "Kanit_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },

  balanceLabel: {
    fontFamily: "Kanit_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },

  balanceValue: {
    fontFamily: "Kanit_700Bold",
    fontSize: 32,
    color: "#fff",
    textAlign: "center",
    marginTop: 2,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  summaryItem: {
    alignItems: "flex-start",
  },

  summaryItemRight: {
    alignItems: "flex-end",
  },

  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  summaryLabelRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryLabel: {
    fontFamily: "Kanit_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },

  summaryValue: {
    fontFamily: "Kanit_700Bold",
    fontSize: 21,
    color: "#fff",
    marginTop: 6,
  },
});
