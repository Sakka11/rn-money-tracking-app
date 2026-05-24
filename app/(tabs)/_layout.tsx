import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../../constants/theme";
import { ProfileProvider } from "../../hooks/use-profile";
import { TransactionsProvider } from "../../hooks/use-transactions";

export const unstable_settings = {
  initialRouteName: "home",
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <TransactionsProvider>
      <ProfileProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: "#fff",
            tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
            tabBarStyle: {
              backgroundColor: Colors.primary,
              borderTopWidth: 0,
              height: 64 + insets.bottom,
              paddingTop: 8,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            },
            tabBarLabelStyle: {
              fontFamily: "Kanit_400Regular",
              fontSize: 11,
            },
          }}
        >
          <Tabs.Screen
            name="income"
            options={{
              title: "เงินเข้า",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={
                    focused ? "arrow-down-circle" : "arrow-down-circle-outline"
                  }
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="home"
            options={{
              title: "หน้าหลัก",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="expense"
            options={{
              title: "เงินออก",
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "arrow-up-circle" : "arrow-up-circle-outline"}
                  size={26}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      </ProfileProvider>
    </TransactionsProvider>
  );
}
