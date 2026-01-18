import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { authEvents } from "@/lib/authEvents";
import {
  navigationRef,
  getCurrentRouteName,
  getCurrentRouteParams,
} from "@/navigation/navigationRef";
import type { RootStackParamList } from "@/types/navigation";
import { pendingRequest } from "@/lib/pendingRequest";

type RedirectInfo = {
  name: keyof RootStackParamList;
  params?: any;
};

export default function AuthGateModal() {
  const [visible, setVisible] = useState(false);
  const [redirect, setRedirect] = useState<RedirectInfo | null>(null);

  // ✅ never show modal on these routes
  const BLOCKED_ROUTES = useMemo(() => new Set(["Splash", "Auth"]), []);

  useEffect(() => {
    const unsub = authEvents.onAuthRequired(() => {
      const current = getCurrentRouteName();
      const params = getCurrentRouteParams();

      // ✅ if nav not ready, don't show
      if (!navigationRef.isReady()) {
        authEvents.unlock();
        return;
      }

      // ✅ block Splash/Auth (prevents popup at boot)
      if (!current || BLOCKED_ROUTES.has(current)) {
        authEvents.unlock();
        return;
      }

      // ✅ store redirect target
      setRedirect({
        name: current as keyof RootStackParamList,
        params,
      });

      setVisible(true);
    });

    return unsub;
  }, [BLOCKED_ROUTES]);

  const onCancel = () => {
    setVisible(false);
    pendingRequest.clear();
    authEvents.unlock();
  };

  const onLoginNow = () => {
    setVisible(false);

    if (!navigationRef.isReady()) {
      authEvents.unlock();
      return;
    }

    navigationRef.navigate("Auth", {
      redirectTo: redirect?.name,
      redirectParams: redirect?.params || {},
    });

    authEvents.unlock();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={22} color="#4F46E5" />
          </View>

          <Text style={styles.title}>Login Required</Text>
          <Text style={styles.subtitle}>
            You need to login to access this feature. We’ll bring you back to the same page after login.
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={onLoginNow}>
              <Text style={styles.loginText}>Login Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#475569", lineHeight: 20 },

  row: { flexDirection: "row", gap: 10, marginTop: 18 },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelText: { fontWeight: "900", color: "#0F172A" },

  loginBtn: {
    flex: 1,
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  loginText: { fontWeight: "900", color: "#fff" },
});
