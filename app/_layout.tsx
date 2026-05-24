import {
  Kanit_400Regular,
  Kanit_700Bold,
  useFonts,
} from "@expo-google-fonts/kanit";

import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { Colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../hooks/use-auth";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // ป้องกันเส้นทาง: ยังไม่ล็อกอิน -> ไปหน้า login, ล็อกอินแล้ว -> เข้าแอป
  useEffect(() => {
    if (loading) return;

    const seg0 = segments[0];
    const inAuthScreen =
      seg0 === "login" ||
      seg0 === "signup" ||
      seg0 === "verify-email" ||
      seg0 === "forgot-password" ||
      seg0 === "reset-password";
    const atSplash = seg0 === undefined;

    if (!session && !inAuthScreen) {
      router.replace("/login");
    } else if (session && (inAuthScreen || atSplash)) {
      router.replace("/(tabs)/home");
    }
  }, [session, loading, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTitleStyle: {
          fontFamily: "Kanit_700Bold",
          fontSize: 20,
          color: "#fff",
        },
        headerTitleAlign: "center",
        headerTintColor: "#fff",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: "โปรไฟล์" }} />
      <Stack.Screen name="[id]" options={{ title: "รายละเอียดรายการ" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Kanit_400Regular,
    Kanit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
