import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";

type PaymentMethod = "CARD" | "UPI" | "CASH";

export default function PaymentScreen({ route, navigation }: any) {
  const { orderId, amount } = route.params;

  const [method, setMethod] = useState<PaymentMethod | null>("UPI");
  const [loading, setLoading] = useState(false);

  const payLabel = useMemo(() => {
    const a = Number(amount || 0).toFixed(2);
    return `Pay ₹${a}`;
  }, [amount]);

  const payNow = async () => {
    if (!method) {
      Alert.alert("Select payment method", "Please choose a method to continue.");
      return;
    }

    try {
      setLoading(true);

      const res: any = await api.post("payments/initiate/", {
        order_id: orderId,
        provider: method === "UPI" ? "UPI" : method === "CARD" ? "CARD" : "CASH",
      });

      /**
       * ✅ Backend response format:
       * { success, message, data: { payment_id, amount, provider } }
       */
      const paymentId = res?.data?.payment_id;

      if (!paymentId) {
        throw new Error("Payment initiation failed");
      }

      navigation.replace("PaymentProcessing", {
        paymentId,
        orderId,
        amount: res?.data?.amount ?? amount,
      });
    } catch (err: any) {
      Alert.alert(
        "Payment Init Failed",
        err?.response?.data?.message || "Unable to initiate payment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Payment</Text>
      </View>

      {/* PAYMENT METHODS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>

        <PaymentOption
          icon="wallet-outline"
          title="UPI"
          subtitle="Pay using any UPI app"
          selected={method === "UPI"}
          onPress={() => setMethod("UPI")}
        />

        <PaymentOption
          icon="card-outline"
          title="Card"
          subtitle="Credit / Debit Card"
          selected={method === "CARD"}
          onPress={() => setMethod("CARD")}
        />

        <PaymentOption
          icon="cash-outline"
          title="Cash"
          subtitle="Pay at counter"
          selected={method === "CASH"}
          onPress={() => setMethod("CASH")}
        />

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Payable Amount</Text>
          <Text style={styles.amountValue}>₹{Number(amount).toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, loading && { opacity: 0.7 }]}
        onPress={payNow}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payText}>{payLabel}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function PaymentOption({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: any) {
  return (
    <TouchableOpacity
      style={[styles.paymentRow, selected && styles.paymentSelected]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.iconCircle, selected && { backgroundColor: "#E0F2FE" }]}>
        <Ionicons name={icon} size={20} color={selected ? "#0284C7" : "#334155"} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSub}>{subtitle}</Text>
      </View>

      {selected && (
        <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
    color: "#0F172A",
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  paymentSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#ECFDF5",
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentTitle: {
    fontWeight: "800",
    color: "#0F172A",
  },
  paymentSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  amountRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  amountLabel: { color: "#64748B", fontWeight: "700" },
  amountValue: { color: "#0F172A", fontWeight: "900" },

  payBtn: {
    backgroundColor: "#0F766E",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  payText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
