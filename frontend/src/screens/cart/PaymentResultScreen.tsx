import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  route: {
    params: {
      success: boolean;
      orderId: number;
    };
  };
  navigation: any;
};

export default function PaymentResultScreen({ route, navigation }: Props) {
  const { success, orderId } = route.params;
  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    try {
      setRetrying(true);

      const res: any = await api.post("payments/initiate/", {
        order_id: orderId,
        provider: "UPI",
      });

      const paymentId = res?.data?.payment_id;

      navigation.replace("PaymentProcessing", {
        paymentId,
        orderId,
      });
    } catch (e) {
      setRetrying(false);
    } finally {
      setRetrying(false);
    }
  };

  const goToOrders = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });

    // ✅ go to orders tab after reset
    setTimeout(() => {
      navigation.navigate("Main", { screen: "OrderTab" });
    }, 50);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, success ? styles.okBg : styles.failBg]}>
        <Ionicons
          name={success ? "checkmark" : "close"}
          size={34}
          color={success ? "#16A34A" : "#DC2626"}
        />
      </View>

      <Text style={styles.title}>
        {success ? "Payment Successful" : "Payment Failed"}
      </Text>

      <Text style={styles.subText}>
        {success
          ? "Payment completed. You can view your exit OTP in Order Details."
          : "Your payment didn’t go through. You can retry safely."}
      </Text>

      {!success && (
        <TouchableOpacity
          style={[styles.primaryBtn, retrying && { opacity: 0.7 }]}
          onPress={retryPayment}
          disabled={retrying}
        >
          {retrying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Retry Payment</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondaryBtn} onPress={goToOrders}>
        <Text style={styles.secondaryText}>
          {success ? "View Orders" : "Go Back"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  okBg: { backgroundColor: "#ECFDF5" },
  failBg: { backgroundColor: "#FEF2F2" },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
    maxWidth: 320,
  },

  primaryBtn: {
    backgroundColor: "#0F766E",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    minWidth: 220,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    minWidth: 220,
    alignItems: "center",
  },
  secondaryText: {
    color: "#0F172A",
    fontWeight: "800",
  },
});
