// Context โปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ (1 แถวต่อ 1 user) + ฟัง Realtime

import React from "react";

import { supabase } from "../services/supabase";
import { Profile } from "../types";
import { useAuth } from "./use-auth";

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
};

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (active) {
        setProfile((data as Profile) ?? null);
        setLoading(false);
      }
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile-${userId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setProfile(null);
          } else {
            setProfile(payload.new as Profile);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const value = React.useMemo<ProfileContextValue>(
    () => ({ profile, loading }),
    [profile, loading],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = React.useContext(ProfileContext);

  if (!ctx) {
    throw new Error("useProfile ต้องอยู่ภายใน ProfileProvider");
  }

  return ctx;
}
