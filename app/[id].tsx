import Ionicons from "@expo/vector-icons/Ionicons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
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
import { formatThaiDate } from "../services/datetime";
import { supabase } from "../services/supabase";
import { TxType } from "../types";

export default function TransactionDetail() {
  const params = useLocalSearchParams();

  const id = params.id as string;
  const tx_date = params.tx_date as string;
  const existingUrl = (params.image_url as string) || "";

  const [detail, setDetail] = React.useState((params.detail as string) || "");
  const [amount, setAmount] = React.useState((params.amount as string) || "");
  const [type, setType] = React.useState<TxType>(
    (params.type as TxType) || "income",
  );

  // รูปสลิป: รูปเดิม + รูปใหม่ที่เพิ่งเลือก
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [base64Image, setBase64Image] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const previewUri = imageUri || existingUrl || null;

  // ถ่ายรูปสลิป
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

  const handleUpdate = async () => {
    const amountNumber = parseFloat(amount);

    if (!detail.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกรายการ");
      return;
    }

    if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert("ข้อมูลไม่ถูกต้อง", "กรุณากรอกจำนวนเงินให้ถูกต้อง");
      return;
    }

    setSaving(true);

    try {
      let nextImageUrl: string | null = existingUrl || null;

      // ถ้ามีการเลือกรูปใหม่ -> อัปโหลดแล้วลบรูปเก่า
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

        nextImageUrl = supabase.storage.from("tx_slips").getPublicUrl(fileName)
          .data.publicUrl;

        // ลบรูปเก่า (ถ้ามี)
        if (existingUrl) {
          const oldFile = existingUrl.split("?")[0].split("/").pop();
          if (oldFile) {
            await supabase.storage.from("tx_slips").remove([oldFile]);
          }
        }
      }

      const { data, error } = await supabase
        .from("transactions")
        .update({
          detail: detail.trim(),
          amount: amountNumber,
          type: type,
          image_url: nextImageUrl,
        })
        .eq("id", id)
        .select();

      if (error) {
        Alert.alert("เกิดข้อผิดพลาด", error.message);
        return;
      }

      if (!data || data.length === 0) {
        Alert.alert(
          "บันทึกไม่สำเร็จ",
          "ไม่สามารถแก้ไขข้อมูลได้ กรุณาตรวจสอบสิทธิ์ (RLS Policy) ของตาราง transactions ใน Supabase",
        );
        return;
      }

      Alert.alert("สำเร็จ", "บันทึกการแก้ไขเรียบร้อยแล้ว", [
        { text: "ตกลง", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("เกิดข้อผิดพลาด", e.message || "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("ยืนยันการลบ", "ต้องการลบรายการนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          const { data, error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id)
            .select();

          if (error) {
            Alert.alert("เกิดข้อผิดพลาด", error.message);
            return;
          }

          if (!data || data.length === 0) {
            Alert.alert(
              "ลบไม่สำเร็จ",
              "ไม่สามารถลบข้อมูลได้ กรุณาตรวจสอบสิทธิ์ (RLS Policy) ของตาราง transactions ใน Supabase",
            );
            return;
          }

          // ลบไฟล์สลิปใน Storage ด้วย (ถ้ามี)
          if (existingUrl) {
            const fileName = existingUrl.split("?")[0].split("/").pop();

            if (fileName) {
              await supabase.storage.from("tx_slips").remove([fileName]);
            }
          }

          Alert.alert("สำเร็จ", "ลบรายการเรียบร้อยแล้ว", [
            { text: "ตกลง", onPress: () => router.back() },
          ]);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* รูปสลิป (กดเพื่อถ่าย/เปลี่ยนรูปได้) */}
        <Text style={styles.label}>รูปสลิป/หลักฐาน</Text>

        <TouchableOpacity
          style={styles.slipBox}
          onPress={takePhoto}
          activeOpacity={0.85}
        >
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.slipImage} />
          ) : (
            <View style={styles.slipPlaceholder}>
              <Ionicons name="camera-outline" size={28} color="#9aa3b5" />
              <Text style={styles.slipHint}>ยังไม่มีรูป — แตะเพื่อถ่าย</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pickBtn}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <Ionicons name="images-outline" size={18} color={Colors.primary} />
          <Text style={styles.pickBtnText}>
            {previewUri ? "เปลี่ยนรูปจากอัลบั้ม" : "เลือกจากอัลบั้ม"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.dateText}>วันที่ {formatThaiDate(tx_date)}</Text>

        {/* ประเภท */}
        <Text style={styles.label}>ประเภท</Text>

        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              { backgroundColor: type === "income" ? Colors.income : "#e9ecf3" },
            ]}
            onPress={() => setType("income")}
          >
            <Text
              style={{
                fontFamily: "Kanit_700Bold",
                color: type === "income" ? "#fff" : "#5a6478",
              }}
            >
              เงินเข้า
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              {
                backgroundColor: type === "expense" ? Colors.expense : "#e9ecf3",
              },
            ]}
            onPress={() => setType("expense")}
          >
            <Text
              style={{
                fontFamily: "Kanit_700Bold",
                color: type === "expense" ? "#fff" : "#5a6478",
              }}
            >
              เงินออก
            </Text>
          </TouchableOpacity>
        </View>

        {/* รายการ */}
        <Text style={styles.label}>รายการ</Text>

        <TextInput
          style={styles.input}
          value={detail}
          onChangeText={setDetail}
          placeholder="DETAIL"
          placeholderTextColor="#9aa3b5"
        />

        {/* จำนวนเงิน */}
        <Text style={styles.label}>จำนวนเงิน</Text>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#9aa3b5"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.saveBtnText}>กำลังบันทึก...</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>บันทึกการแก้ไข</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          activeOpacity={0.7}
          onPress={handleDelete}
          disabled={saving}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.expense} />
          <Text style={styles.deleteBtnText}>ลบรายการนี้</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  slipBox: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.bgSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  slipImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  slipPlaceholder: {
    alignItems: "center",
    gap: 6,
  },

  slipHint: {
    fontFamily: "Kanit_400Regular",
    color: "#9aa3b5",
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

  dateText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 24,
    color: Colors.text,
    textAlign: "center",
    marginTop: 28,
    marginBottom: 8,
  },

  label: {
    fontFamily: "Kanit_700Bold",
    fontSize: 15,
    color: Colors.text,
    marginTop: 18,
    marginBottom: 8,
  },

  typeRow: {
    flexDirection: "row",
    gap: 12,
  },

  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  input: {
    fontFamily: "Kanit_400Regular",
    fontSize: 18,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  saveBtn: {
    marginTop: 32,
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

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 8,
    gap: 8,
  },

  deleteBtnText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 16,
    color: Colors.expense,
  },
});
