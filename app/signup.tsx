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

import BackButton from "../components/back-button";
import { Colors } from "../constants/theme";
import { useAuth } from "../hooks/use-auth";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    if (password.length < 6) {
      Alert.alert("รหัสผ่านสั้นเกินไป", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirm) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณายืนยันรหัสผ่านให้ตรงกัน");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("สมัครไม่สำเร็จ", error);
      return;
    }

    // สมัครสำเร็จ -> ไปหน้ายืนยันอีเมลด้วยรหัส OTP
    Alert.alert(
      "สมัครสมาชิกสำเร็จ",
      "เราได้ส่งรหัสยืนยันไปที่อีเมลของคุณ กรุณากรอกรหัสเพื่อยืนยัน",
      [
        {
          text: "ตกลง",
          onPress: () =>
            router.replace({
              pathname: "/verify-email",
              params: { email: email.trim() },
            }),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <BackButton to="/login" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Ionicons name="person-add" size={42} color={Colors.primary} />
        </View>

        <Text style={styles.title}>สมัครสมาชิก</Text>
        <Text style={styles.subtitle}>
          สร้างบัญชีเพื่อเริ่มบันทึกรายรับ-รายจ่าย
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

          <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm Password"
            placeholderTextColor="#9aa3b5"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>สมัครสมาชิก</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>มีบัญชีอยู่แล้ว ?</Text>
            <Link href="/login" replace asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>เข้าสู่ระบบ</Text>
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
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
    marginBottom: 24,
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
