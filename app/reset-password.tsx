import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
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

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";

  const { verifyRecoveryOtp, updatePassword, resetPassword } = useAuth();

  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleReset = async () => {
    if (code.trim().length < 6) {
      Alert.alert("รหัสไม่ครบ", "กรุณากรอกรหัสยืนยัน 6 หลัก");
      return;
    }

    if (password.length < 6) {
      Alert.alert("รหัสผ่านสั้นเกินไป", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirm) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณายืนยันรหัสผ่านให้ตรงกัน");
      return;
    }

    setLoading(true);

    // 1) ยืนยันรหัส OTP
    const verify = await verifyRecoveryOtp(email, code);

    if (verify.error) {
      setLoading(false);
      Alert.alert("รหัสไม่ถูกต้อง", "รหัสยืนยันไม่ถูกต้องหรือหมดอายุ");
      return;
    }

    // 2) ตั้งรหัสผ่านใหม่
    const update = await updatePassword(password);
    setLoading(false);

    if (update.error) {
      Alert.alert("ตั้งรหัสใหม่ไม่สำเร็จ", update.error);
      return;
    }

    Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    // ยืนยันสำเร็จ -> มี session แล้ว auth gate จะพาเข้าแอปเอง
  };

  const handleResend = async () => {
    const { error } = await resetPassword(email);

    if (error) {
      Alert.alert("ส่งรหัสไม่สำเร็จ", error);
      return;
    }

    Alert.alert("ส่งรหัสใหม่แล้ว", "กรุณาตรวจสอบอีเมลอีกครั้ง");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <BackButton to="/forgot-password" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Ionicons name="shield-checkmark" size={42} color={Colors.primary} />
        </View>

        <Text style={styles.title}>ตั้งรหัสผ่านใหม่</Text>
        <Text style={styles.subtitle}>
          กรอกรหัสยืนยันที่ส่งไปที่ {email || "อีเมลของคุณ"}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>รหัสยืนยันจากอีเมล</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={setCode}
            placeholder="------"
            placeholderTextColor="#c4cbd4"
            keyboardType="number-pad"
            maxLength={10}
          />

          <Text style={styles.label}>รหัสผ่านใหม่</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="อย่างน้อย 6 ตัวอักษร"
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

          <Text style={styles.label}>ยืนยันรหัสผ่านใหม่</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            placeholderTextColor="#9aa3b5"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>ยืนยันและตั้งรหัสใหม่</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendLink} onPress={handleResend}>
            <Text style={styles.resendText}>ส่งรหัสอีกครั้ง</Text>
          </TouchableOpacity>
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

  codeInput: {
    fontFamily: "Kanit_700Bold",
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 4,
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

  resendLink: {
    alignItems: "center",
    marginTop: 18,
  },

  resendText: {
    fontFamily: "Kanit_700Bold",
    color: Colors.primary,
  },
});
