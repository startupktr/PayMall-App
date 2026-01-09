import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import api from "../api/axios";

type Props = {
  route: {
    params: {
      success: boolean;
      orderId: string;
      paymentId?: string;
    };
  };
  navigation: any;
};

export default function PaymentResultScreen({ route, navigation }: Props) {
  const { success, orderId, paymentId } = route.params;

  const retryPayment = async () => {
    const res = await api.post("/payments/initiate/", {
      order_id: orderId,
      provider: "UPI",
    });

    navigation.replace("PaymentProcessing", {
      paymentId: res.data.payment_id,
      orderId,
    });
  };

  const goToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, success ? styles.success : styles.fail]}>
        {success ? "✓" : "✕"}
      </Text>

      <Text style={styles.title}>
        {success ? "Payment Successful" : "Payment Failed"}
      </Text>

      <Text style={styles.subText}>
        {success
          ? "You may exit the mall using the OTP shown at the gate."
          : "Your payment could not be completed. You can retry safely."}
      </Text>

      {!success && (
        <TouchableOpacity style={styles.primaryBtn} onPress={retryPayment}>
          <Text style={styles.btnText}>Retry Payment</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondaryBtn} onPress={goToHome}>
        <Text style={styles.secondaryText}>
          {success ? "Go to Home" : "Cancel"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  success: { color: "green" },
  fail: { color: "red" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#000",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: 12,
  },
  secondaryText: {
    color: "#555",
    fontSize: 14,
  },
});
