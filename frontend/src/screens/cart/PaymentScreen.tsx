import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";

type PaymentMethod = "UPI" | "CARD" | "CASH";

export default function PaymentScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [loading, setLoading] = useState(false);

  const theme = useMemo(() => {
    return {
      bg: isDark ? "#020617" : "#F8FAFC",
      headerBg: isDark ? "#0B1220" : "#FFFFFF",
      cardBg: isDark ? "#0F172A" : "#FFFFFF",
      border: isDark ? "#1E293B" : "#E2E8F0",
      text: isDark ? "#F8FAFC" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      rowBg: isDark ? "#0B1220" : "#FFFFFF",
      selectedBg: isDark ? "#052E2B" : "#ECFDF5",
      selectedBorder: "#22C55E",
      btnBg: "#0F766E",
      btnText: "#FFFFFF",
    };
  }, [isDark]);

  const provider = useMemo(() => {
    // ✅ backend accepted values can be "UPI" | "CARD" | "CASH"
    if (method === "UPI") return "UPI";
    if (method === "CARD") return "CARD";
    return "CASH";
  }, [method]);

  const payNow = async () => {
    try {
      setLoading(true);

      // ✅ Create payment attempt ONLY after user chooses method
      const res: any = await api.post("payments/create-attempt/", {
        order_id: orderId,
        provider, // ✅ uses selected payment method
      });

      const success = res?.success ?? true;
      const data = res?.data ?? res;

      if (!success || !data?.attempt_id) {
        Alert.alert("Error", res?.message || "Payment init failed");
        return;
      }

      // ✅ after attempt created, move to processing screen
      navigation.replace("PaymentProcessing", {
        attemptId: data.attempt_id,
        orderId,
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

  const payLabel = useMemo(() => {
    if (method === "UPI") return "Pay with UPI";
    if (method === "CARD") return "Pay with Card";
    return "Confirm Cash Payment";
  }, [method]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Choose Payment</Text>
      </View>

      {/* CARD */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Method</Text>

        <PaymentOption
          theme={theme}
          icon="wallet-outline"
          title="UPI"
          subtitle="Pay using any UPI app"
          selected={method === "UPI"}
          onPress={() => setMethod("UPI")}
        />

        <PaymentOption
          theme={theme}
          icon="card-outline"
          title="Card"
          subtitle="Credit / Debit Card"
          selected={method === "CARD"}
          onPress={() => setMethod("CARD")}
        />

        <PaymentOption
          theme={theme}
          icon="cash-outline"
          title="Cash"
          subtitle="Pay at counter"
          selected={method === "CASH"}
          onPress={() => setMethod("CASH")}
        />
      </View>

      {/* PAY */}
      <TouchableOpacity
        style={[styles.payBtn, { backgroundColor: theme.btnBg }, loading && { opacity: 0.7 }]}
        onPress={payNow}
        disabled={loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.payText, { color: theme.btnText }]}>{payLabel}</Text>
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
  theme,
}: any) {
  return (
    <TouchableOpacity
      style={[
        styles.paymentRow,
        {
          backgroundColor: selected ? theme.selectedBg : theme.rowBg,
          borderColor: selected ? theme.selectedBorder : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: selected ? "#E0F2FE" : theme.border },
        ]}
      >
        <Ionicons name={icon} size={20} color={selected ? "#0284C7" : theme.subText} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.paymentTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.paymentSub, { color: theme.subText }]}>{subtitle}</Text>
      </View>

      {selected && <Ionicons name="checkmark-circle" size={22} color="#16A34A" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "900" },

  card: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 14 },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentTitle: { fontWeight: "900" },
  paymentSub: { fontSize: 12, marginTop: 2, fontWeight: "600" },

  payBtn: {
    margin: 16,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  payText: { fontWeight: "900", fontSize: 16 },
});
