import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      Alert.alert("ส่งรหัสไม่สำเร็จ", error);
      return;
    }

    Alert.alert(
      "ส่งรหัสแล้ว",
      "เราได้ส่งรหัส OTP เพื่อใช้ยืนยันไปที่อีเมลของคุณ กรุณาตรวจสอบกล่องจดหมาย",
      [
        {
          text: "ตกลง",
          onPress: () =>
            router.replace({
              pathname: "/reset-password",
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
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Ionicons name="lock-closed" size={42} color={Colors.primary} />
        </View>

        <Text style={styles.title}>ลืมรหัสผ่าน</Text>
        <Text style={styles.subtitle}>
          กรอกอีเมลที่สมัครไว้ เราจะส่งรหัสยืนยันไปให้
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

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>ส่งรหัสยืนยัน</Text>
            )}
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
    marginTop: 4,
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
});
