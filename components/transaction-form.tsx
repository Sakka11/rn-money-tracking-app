import Ionicons from "@expo/vector-icons/Ionicons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/theme";
import { bangkokToday, formatThaiDate } from "../services/datetime";
import { supabase } from "../services/supabase";
import { TxType } from "../types";
import BalanceHeader from "./balance-header";

export default function TransactionForm({ type }: { type: TxType }) {
  const isIncome = type === "income";
  const accent = isIncome ? Colors.income : Colors.expense;
  const word = isIncome ? "เงินเข้า" : "เงินออก";

  const [detail, setDetail] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [base64Image, setBase64Image] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const today = bangkokToday();

  const resetForm = () => {
    setDetail("");
    setAmount("");
    setImageUri(null);
    setBase64Image(null);
  };

  // ถ่ายภาพสลิป (ขอสิทธิ์ก่อนทุกครั้ง กัน PDPA)
  const takePhoto = () => {
    Alert.alert("แจ้งเตือน", "แอปต้องการเปิดกล้องเพื่อถ่ายภาพสลิป", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ตกลง",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();

          if (status !== "granted") {
            Alert.alert("ไม่สามารถใช้งานกล้องได้", "กรุณาอนุญาตการเข้าถึงกล้อง");
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.5,
            base64: true,
          });

          if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setBase64Image(result.assets[0].base64 || null);
          }
        },
      },
    ]);
  };

  // เลือกสลิปจากอัลบั้ม
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("ไม่สามารถเข้าถึงอัลบั้มได้", "กรุณาอนุญาตการเข้าถึงคลังรูปภาพ");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
    }
  };

  const handleSave = async () => {
    // Validate UI
    const amountNumber = parseFloat(amount);

    if (!detail.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", `กรุณากรอกรายการ${word}`);
      return;
    }

    if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert("ข้อมูลไม่ถูกต้อง", `กรุณากรอกจำนวน${word}ให้ถูกต้อง`);
      return;
    }

    setSaving(true);

    try {
      let image_url: string | null = null;

      // อัปโหลดสลิป (ถ้ามี)
      if (base64Image) {
        const fileName = `${type}_${Date.now()}.jpg`;
        const binaryData = decode(base64Image);

        const { error: uploadError } = await supabase.storage
          .from("tx_slips")
          .upload(fileName, binaryData, { contentType: "image/jpeg" });

        if (uploadError) {
          Alert.alert("อัปโหลดรูปไม่สำเร็จ", uploadError.message);
          return;
        }

        image_url = supabase.storage.from("tx_slips").getPublicUrl(fileName)
          .data.publicUrl;
      }

      // บันทึกลงฐานข้อมูล
      const { error: insertError } = await supabase.from("transactions").insert({
        detail: detail.trim(),
        amount: amountNumber,
        type: type,
        tx_date: today,
        image_url: image_url,
      });

      if (insertError) {
        Alert.alert("บันทึกไม่สำเร็จ", insertError.message);
        return;
      }

      Alert.alert("สำเร็จ", `บันทึก${word}เรียบร้อยแล้ว`, [
        {
          text: "ตกลง",
          onPress: () => {
            resetForm();
            router.replace("/(tabs)/home");
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message || "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <BalanceHeader />

        <View style={styles.body}>
          <Text style={styles.dateText}>วันที่ {formatThaiDate(today)}</Text>

          <Text style={[styles.sectionTitle, { color: accent }]}>{word}</Text>

          {/* รายการ */}
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>รายการ{word}</Text>

            <TextInput
              style={styles.input}
              placeholder="DETAIL"
              placeholderTextColor="#9aa3b5"
              value={detail}
              onChangeText={setDetail}
            />
          </View>

          {/* จำนวนเงิน */}
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>จำนวน{word}</Text>

            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9aa3b5"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* สลิป (ถ้ามี) */}
          <TouchableOpacity
            style={styles.slipBox}
            onPress={takePhoto}
            activeOpacity={0.85}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.slipImage} />
            ) : (
              <View style={styles.slipPlaceholder}>
                <Ionicons name="camera-outline" size={28} color="#9aa3b5" />
                <Text style={styles.slipHint}>แนบสลิป/หลักฐาน (ถ้ามี)</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickBtn}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={18} color={Colors.primary} />
            <Text style={styles.pickBtnText}>เลือกจากอัลบั้ม</Text>
          </TouchableOpacity>

          {/* ปุ่มบันทึก */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.saveBtnText}>กำลังบันทึก...</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>บันทึก{word}</Text>
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
    backgroundColor: Colors.bg,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  dateText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 26,
    color: Colors.text,
    textAlign: "center",
  },

  sectionTitle: {
    fontFamily: "Kanit_700Bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 22,
  },

  inputBox: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    marginBottom: 18,
  },

  inputLabel: {
    fontFamily: "Kanit_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },

  input: {
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
  },

  slipBox: {
    height: 150,
    borderRadius: 12,
    backgroundColor: Colors.bgSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  slipPlaceholder: {
    alignItems: "center",
    gap: 6,
  },

  slipHint: {
    fontFamily: "Kanit_400Regular",
    color: "#9aa3b5",
  },

  slipImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  pickBtnText: {
    fontFamily: "Kanit_700Bold",
    color: Colors.primary,
  },

  saveBtn: {
    marginTop: 24,
    height: 58,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtnDisabled: {
    backgroundColor: Colors.primaryLight,
  },

  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  saveBtnText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 17,
    color: "#fff",
  },
});
