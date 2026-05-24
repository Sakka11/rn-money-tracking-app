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

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";

  const { verifySignupOtp, resendSignupOtp } = useAuth();

  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleVerify = async () => {
    if (code.trim().length < 6) {
      Alert.alert("รหัสไม่ครบ", "กรุณากรอกรหัสยืนยัน 6 หลัก");
      return;
    }

    setLoading(true);
    const { error } = await verifySignupOtp(email, code);
    setLoading(false);

    if (error) {
      Alert.alert("ยืนยันไม่สำเร็จ", "รหัสยืนยันไม่ถูกต้องหรือหมดอายุ");
      return;
    }

    Alert.alert("ยืนยันอีเมลสำเร็จ", "อีเมลของคุณใช้งานได้แล้ว");
    // สำเร็จ -> มี session แล้ว auth gate จะพาเข้าแอปเอง
  };

  const handleResend = async () => {
    const { error } = await resendSignupOtp(email);

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

      <BackButton to="/login" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Ionicons name="mail-unread" size={42} color={Colors.primary} />
        </View>

        <Text style={styles.title}>ยืนยันอีเมล</Text>
        <Text style={styles.subtitle}>
          เราได้ส่งรหัส OTP เพื่อใช้ยืนยันไปที่{"\n"}
          {email || "อีเมลของคุณ"}
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

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>ยืนยันอีเมล</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendLink} onPress={handleResend}>
            <Text style={styles.resendText}>
              ยังไม่ได้รับรหัส ? ส่งอีกครั้ง
            </Text>
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

  btn: {
    marginTop: 24,
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
