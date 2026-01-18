import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, BackHandler } from "react-native";
import api from "@/api/axios";

type Props = {
  route: { params: { attemptId: number; orderId: number } };
  navigation: any;
};

export default function PaymentProcessingScreen({ route, navigation }: Props) {
  const { attemptId, orderId } = route.params;
  const [message] = useState("Processing your payment...");

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);

    const timer = setTimeout(() => {
      finalizePayment(true);
    }, 2000);

    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, []);

  const finalizePayment = async (success: boolean) => {
    try {
      const res: any = await api.post("payments/verify/", {
        attempt_id: attemptId,
        success,
        provider_payment_id: "MOCK_TXN_12345",
      });

      navigation.replace("PaymentResult", {
        success: true,
        orderId,
      });
    } catch (err) {
      navigation.replace("PaymentResult", {
        success: false,
        orderId,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loaderRing}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>

      <Text style={styles.title}>{message}</Text>
      <Text style={styles.subText}>
        Please don’t close the app. We’re confirming your transaction.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderRing: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { marginTop: 20, fontSize: 18, fontWeight: "900", color: "#0F172A" },
  subText: { marginTop: 10, fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 },
});
