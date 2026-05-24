import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ปุ่มย้อนกลับมุมบนซ้าย ใช้ในหน้า auth (พื้นหลังสีฟ้า)
export default function BackButton({ to }: { to: Href }) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.btn, { top: insets.top + 6 }]}
      onPress={() => router.replace(to)}
      activeOpacity={0.7}
      hitSlop={12}
    >
      <Ionicons name="arrow-back" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    padding: 6,
  },
});
