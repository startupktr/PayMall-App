import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import api from "../api/axios";

type Props = {
  route: {
    params: {
      paymentId: string;
      orderId: string;
    };
  };
  navigation: any;
};

export default function PaymentProcessingScreen({ route, navigation }: Props) {
  const { paymentId, orderId } = route.params;
  const [message, setMessage] = useState("Processing payment...");

  useEffect(() => {
    // 🔒 Disable back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    // 🔥 Simulate payment gateway callback
    setTimeout(() => {
      checkPaymentStatus();
    }, 3000);

    return () => backHandler.remove();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const res = await api.post("/payments/success/", {
        payment_id: paymentId,
        gateway_payment_id: "GATEWAY12345",
      });

      navigation.replace("PaymentResult", {
        success: true,
        orderId,
      });
    } catch (error) {
      navigation.replace("PaymentResult", {
        success: false,
        orderId,
        paymentId,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.subText}>
        Please do not press back or close the app
      </Text>
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
  title: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
});
