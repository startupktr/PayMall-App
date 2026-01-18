import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/api/axios";
import { useCart } from "@/context/CartContext";

export default function CheckoutScreen({ navigation, route }: any) {
  const { mall_id } = route.params || {};
  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [showTax, setShowTax] = useState(false);

  const createOrder = async () => {
    try {
      setLoading(true);

      // ✅ backend creates order with POS GST breakup
      const res = await api.post("orders/create/", {mall_id});
      console.log("res:", res)
      if (!res.data.success) {
        Alert.alert("Error", res.data.message || "Unable to create order");
        return;
      }

      const order = res.data;

      navigation.navigate("Payment", {
        orderId: order.id,
        amount: order.total, // payable total inclusive
      });
    } catch (err) {
      console.log("CREATE ORDER ERROR:", err);
      Alert.alert("Error", "Unable to create order");
    } finally {
      setLoading(false);
    }
  };

  const items = cart?.items || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ITEMS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>

          {items.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.itemText} numberOfLines={1}>
                {item.quantity} × {item.product.name}
              </Text>
              <Text style={styles.priceText}>
                ₹{(Number(item.product.price) * Number(item.quantity)).toFixed(2)}
              </Text>
            </View>
          ))}

          {items.length === 0 && (
            <Text style={{ color: "#64748B", marginTop: 10 }}>
              No items in cart
            </Text>
          )}
        </View>

        {/* BILL SUMMARY */}
        <View style={styles.card}>
          <View style={styles.billHeader}>
            <Text style={styles.cardTitle}>Bill Summary</Text>

            <TouchableOpacity onPress={() => setShowTax((p) => !p)} style={styles.breakupBtn}>
              <Text style={styles.breakupText}>
                {showTax ? "Hide breakup" : "Show breakup"}
              </Text>
              <Ionicons
                name={showTax ? "chevron-up" : "chevron-down"}
                size={16}
                color="#4F46E5"
              />
            </TouchableOpacity>
          </View>

          {/* ✅ POS style values */}
          <BillRow label="Total Payable (Incl. GST)" value={Number(cart?.total_amount || 0)} bold />

          {showTax && (
            <View style={styles.breakupBox}>
              <BillRow label="Taxable Amount" value={Number(cart?.taxable_subtotal || 0)} />
              <BillRow label="GST Included" value={Number(cart?.gst_total || 0)} />
              <BillRow label="CGST" value={Number(cart?.cgst || 0)} />
              <BillRow label="SGST" value={Number(cart?.sgst || 0)} />
              <Text style={styles.note}>Prices are GST inclusive</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* PAY BUTTON */}
      <TouchableOpacity style={[styles.payBtn, loading && { opacity: 0.7 }]} onPress={createOrder} disabled={loading}>
        {loading ? (
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.payText}>Creating Order...</Text>
          </View>
        ) : (
          <Text style={styles.payText}>Proceed to Pay</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function BillRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.billLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.billValue, bold && styles.bold]}>
        ₹{Number(value).toFixed(2)}
      </Text>
    </View>
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
  headerTitle: { fontSize: 18, fontWeight: "900" },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 12, color: "#0F172A" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
    gap: 12,
  },

  itemText: { fontSize: 14, color: "#0F172A", flex: 1, fontWeight: "700" },
  priceText: { fontWeight: "900", color: "#0F172A" },

  billLabel: { color: "#475569", fontWeight: "700" },
  billValue: { fontWeight: "800", color: "#0F172A" },

  bold: { fontWeight: "900", color: "#0F172A" },

  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  breakupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  breakupText: { color: "#4F46E5", fontWeight: "800" },

  breakupBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
  },

  note: { marginTop: 6, fontSize: 12, color: "#475569", fontWeight: "600" },

  payBtn: {
    backgroundColor: "#4F46E5",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
