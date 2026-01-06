import React from "react";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import HomeStack from "./HomeStack";
import CartScreen from "../screens/CartScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ScannerScreen from "../screens/ScannerScreen";
import RequireAuth from "../components/RequireAuth";
import { MainTabParamList } from "../types/navigation"; 

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (route.params?.redirectTo) {
      navigation.navigate(
        route.params.redirectTo,
        route.params.redirectParams
      );

      navigation.setParams({
        redirectTo: undefined,
        redirectParams: undefined,
      });
    }
  }, []);

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,

        /* 🎨 COLORS */
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",

        /* 🧱 TAB BAR STYLE */
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
        },

        /* ⭐ ICON + TOP INDICATOR */
        tabBarIcon: ({ color, focused, size }) => {
          let iconName: any;

          if (route.name === "HomeTab") iconName = "home";
          else if (route.name === "Orders") iconName = "receipt";
          else if (route.name === "Scan") iconName = "scan";
          else if (route.name === "Cart") iconName = "cart";
          else if (route.name === "Profile") iconName = "person";

          return (
            <View style={styles.iconWrapper}>
              {/* 🔵 TOP ACTIVE INDICATOR */}
              {focused && <View style={styles.activeLine} />}

              <Ionicons
                name={iconName}
                size={size ?? 22}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: "Home" }}
      />

      <Tab.Screen
        name="Orders"
        children={() => (
          <RequireAuth>
            <OrdersScreen />
          </RequireAuth>
        )}
      />

      <Tab.Screen
        name="Scan"
        component={ScannerScreen}
      />

      <Tab.Screen
        name="Cart"
        children={() => (
          <RequireAuth>
            <CartScreen />
          </RequireAuth>
        )}
      />

      <Tab.Screen
        name="Profile"
        children={() => (
          <RequireAuth>
            <ProfileScreen />
          </RequireAuth>
        )}
      />
    </Tab.Navigator>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
  },

  activeLine: {
    position: "absolute",
    top: -8,              // 👈 attached to tab bar top
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },
});
