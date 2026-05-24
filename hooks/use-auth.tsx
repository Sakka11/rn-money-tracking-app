// Context จัดการสถานะ Auth (session ผู้ใช้) + ฟังก์ชัน login/signup/logout

import type { Session } from "@supabase/supabase-js";
import React from "react";

import { supabase } from "../services/supabase";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  // ยืนยันอีเมลด้วยรหัส OTP ที่ส่งไปตอนสมัคร
  verifySignupOtp: (
    email: string,
    token: string,
  ) => Promise<{ error: string | null }>;
  // ส่งรหัสยืนยันอีเมลใหม่
  resendSignupOtp: (email: string) => Promise<{ error: string | null }>;
  // ลืมรหัสผ่าน: ส่งรหัส OTP ไปอีเมล
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  // ยืนยันรหัส OTP ที่ส่งไปอีเมล (ขั้นตอนรีเซ็ตรหัส)
  verifyRecoveryOtp: (
    email: string,
    token: string,
  ) => Promise<{ error: string | null }>;
  // ตั้งรหัสผ่านใหม่ (หลังยืนยัน OTP สำเร็จ)
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // โหลด session ปัจจุบัน (จาก AsyncStorage)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // ฟังการเปลี่ยนสถานะล็อกอิน/ออก
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { error: error?.message ?? null };
  }, []);

  const signUp = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    return { error: error?.message ?? null };
  }, []);

  // ยืนยันอีเมลด้วยรหัส OTP 6 หลักที่ส่งไปตอนสมัคร -> ได้ session เลย
  const verifySignupOtp = React.useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "signup",
      });

      return { error: error?.message ?? null };
    },
    [],
  );

  // ส่งรหัสยืนยันอีเมลใหม่อีกครั้ง
  const resendSignupOtp = React.useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    return { error: error?.message ?? null };
  }, []);

  // ลืมรหัสผ่าน: ส่งรหัส OTP ไปยังอีเมล
  const resetPassword = React.useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    return { error: error?.message ?? null };
  }, []);

  // ยืนยันรหัส OTP ที่ส่งไปอีเมล -> ได้ session ชั่วคราวเพื่อตั้งรหัสใหม่
  const verifyRecoveryOtp = React.useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "recovery",
      });

      return { error: error?.message ?? null };
    },
    [],
  );

  // ตั้งรหัสผ่านใหม่
  const updatePassword = React.useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    return { error: error?.message ?? null };
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn,
      signUp,
      verifySignupOtp,
      resendSignupOtp,
      resetPassword,
      verifyRecoveryOtp,
      updatePassword,
      signOut,
    }),
    [
      session,
      loading,
      signIn,
      signUp,
      verifySignupOtp,
      resendSignupOtp,
      resetPassword,
      verifyRecoveryOtp,
      updatePassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth ต้องอยู่ภายใน AuthProvider");
  }

  return ctx;
}
