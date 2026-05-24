import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/theme";

export default function Splash() {
  // แสดงโลโก้ระหว่างเช็ก session — การ redirect จัดการโดย auth gate ใน _layout
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.logoCircle}>
        <Ionicons name="wallet" size={64} color={Colors.primary} />
      </View>

      <Text style={styles.title}>Money Tracking</Text>

      <Text style={styles.subtitle}>รายรับ-รายจ่าย ยอดเงิน</Text>

      <ActivityIndicator
        size="large"
        color="#fff"
        style={{ marginTop: 28 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  title: {
    fontFamily: "Kanit_700Bold",
    fontSize: 32,
    color: "#fff",
  },

  subtitle: {
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
});
