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
import { useAuth } from "../hooks/use-auth";
import { supabase } from "../services/supabase";
import { Profile } from "../types";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const email = session?.user.email ?? "";

  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [base64Image, setBase64Image] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // โหลดโปรไฟล์ของผู้ใช้ปัจจุบัน
  React.useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const p = data as Profile | null;

      if (p) {
        setDisplayName(p.display_name ?? "");
        setAvatarUrl(p.avatar_url ?? null);
      }

      setLoading(false);
    };

    load();
  }, [userId]);

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "ต้องการออกจากระบบใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: async () => {
          await signOut();
          // auth gate จะพากลับไปหน้า login เอง
        },
      },
    ]);
  };

  // ถ่ายรูปโปรไฟล์
  const takePhoto = () => {
    Alert.alert("แจ้งเตือน", "แอปต้องการเปิดกล้องเพื่อถ่ายรูปโปรไฟล์", [
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
            allowsEditing: true,
            aspect: [1, 1],
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

  // เลือกรูปจากอัลบั้ม
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("ไม่สามารถเข้าถึงอัลบั้มได้", "กรุณาอนุญาตการเข้าถึงคลังรูปภาพ");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อโปรไฟล์");
      return;
    }

    setSaving(true);

    try {
      let nextAvatarUrl = avatarUrl;

      // อัปโหลดรูปใหม่ (ถ้ามีการเลือก)
      if (base64Image) {
        const fileName = `avatar_${Date.now()}.jpg`;
        const binaryData = decode(base64Image);

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, binaryData, { contentType: "image/jpeg" });

        if (uploadError) {
          Alert.alert("อัปโหลดรูปไม่สำเร็จ", uploadError.message);
          return;
        }

        nextAvatarUrl = supabase.storage.from("avatars").getPublicUrl(fileName)
          .data.publicUrl;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: displayName.trim(),
        avatar_url: nextAvatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        Alert.alert("บันทึกไม่สำเร็จ", error.message);
        return;
      }

      Alert.alert("สำเร็จ", "บันทึกโปรไฟล์เรียบร้อยแล้ว", [
        { text: "ตกลง", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message || "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const previewUri = imageUri || avatarUrl;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: 24, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* รูปโปรไฟล์ */}
        <TouchableOpacity
          style={styles.avatar}
          activeOpacity={0.85}
          onPress={takePhoto}
        >
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={64} color="#fff" />
          )}

          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pickBtn}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <Ionicons name="images-outline" size={18} color={Colors.primary} />
          <Text style={styles.pickBtnText}>เลือกรูปจากอัลบั้ม</Text>
        </TouchableOpacity>

        {/* อีเมล (แก้ไขไม่ได้) */}
        {email ? <Text style={styles.email}>{email}</Text> : null}

        {/* ชื่อ */}
        <View style={styles.field}>
          <Text style={styles.label}>ชื่อที่แสดง</Text>

          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="เช่น สมชาย ใจดี"
            placeholderTextColor="#9aa3b5"
          />
        </View>

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
            <Text style={styles.saveBtnText}>บันทึกโปรไฟล์</Text>
          )}
        </TouchableOpacity>

        {/* ออกจากระบบ */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.expense} />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
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

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
  },

  cameraBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  pickBtnText: {
    fontFamily: "Kanit_700Bold",
    color: Colors.primary,
  },

  email: {
    fontFamily: "Kanit_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 14,
  },

  field: {
    width: "100%",
    marginTop: 20,
  },

  label: {
    fontFamily: "Kanit_700Bold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 8,
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
    width: "100%",
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

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    paddingVertical: 10,
  },

  logoutText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 16,
    color: Colors.expense,
  },
});
