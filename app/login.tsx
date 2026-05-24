import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";
import { useAuth } from "../hooks/use-auth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      // ยังไม่ยืนยันอีเมล -> พาไปหน้ายืนยัน
      if (error.toLowerCase().includes("confirm")) {
        Alert.alert("ยังไม่ได้ยืนยันอีเมล", "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ", [
          {
            text: "ยืนยันเลย",
            onPress: () =>
              router.replace({
                pathname: "/verify-email",
                params: { email: email.trim() },
              }),
          },
        ]);
        return;
      }

      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
    // สำเร็จ -> auth gate จะพาเข้าแอปเอง
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Ionicons name="wallet" size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Money Tracking</Text>
        <Text style={styles.subtitle}>
          เข้าสู่ระบบเพื่อจัดการรายรับ-รายจ่าย
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>อีเมล</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Username"
            placeholderTextColor="#9aa3b5"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>รหัสผ่าน</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9aa3b5"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9aa3b5"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>เข้าสู่ระบบ</Text>
            )}
          </TouchableOpacity>

          <Link href="/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>ลืมรหัสผ่าน ?</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.footer}>
            <Text style={styles.footerText}>ยังไม่มีบัญชี ?</Text>
            <Link href="/signup" replace asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>สมัครสมาชิก</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontFamily: "Kanit_700Bold",
    fontSize: 28,
    color: "#fff",
  },

  subtitle: {
    fontFamily: "Kanit_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    marginBottom: 26,
    textAlign: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },

  label: {
    fontFamily: "Kanit_700Bold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  passwordInput: {
    flex: 1,
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
  },

  btn: {
    marginTop: 26,
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  btnDisabled: {
    backgroundColor: Colors.primaryLight,
  },

  btnText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 17,
    color: "#fff",
  },

  forgotLink: {
    alignSelf: "center",
    marginTop: 16,
  },

  forgotText: {
    fontFamily: "Kanit_400Regular",
    color: Colors.primary,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },

  footerText: {
    fontFamily: "Kanit_400Regular",
    color: Colors.textMuted,
  },

  footerLink: {
    fontFamily: "Kanit_700Bold",
    color: Colors.primary,
  },
});
