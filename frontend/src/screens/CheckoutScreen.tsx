import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/axios";

const ORDER_ITEMS = [
  { id: 1, name: "Smart Watch", qty: 2, price: 399 },
  { id: 2, name: "Wireless Earbuds", qty: 2, price: 2499 },
];

export default function CheckoutScreen({ route, navigation }: any) {
  const { subtotal, discount, gst, total } = route.params;

  const createOrder = async () => {
    try {
      const res = await api.post("orders/create/", {
        payment_method: "UPI", // default, can be changed later
      });

      navigation.navigate("Payment", {
        orderId: res.data.id,
        amount: res.data.total,
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Unable to create order");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} />
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {/* ORDER SUMMARY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>

        {ORDER_ITEMS.map(item => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.itemText}>
              {item.qty}x {item.name}
            </Text>
            <Text style={styles.priceText}>
              ₹{item.qty * item.price}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <BillRow label="Subtotal" value={subtotal} />
        <BillRow
          label="Discount (10%)"
          value={-discount}
          green
        />
        {/* <BillRow label="Tax (18%)" value={tax} /> */}

        <View style={styles.divider} />

        <BillRow label="Total Amount" value={total} bold />
      </View>

      {/* PAY BUTTON */}
      <TouchableOpacity style={styles.payBtn} onPress={createOrder}>
        <Text style={styles.payText}>Proceed to Pay</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------------- HELPERS ---------------- */

function BillRow({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: number;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.billLabel,
          bold && styles.bold,
          green && styles.green,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.billValue,
          bold && styles.bold,
          green && styles.green,
        ]}
      >
        ₹{value.toFixed(2)}
      </Text>
    </View>
  );
}



/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

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
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  itemText: {
    fontSize: 14,
    color: "#020617",
  },
  priceText: {
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },

  billLabel: {
    color: "#475569",
  },
  billValue: {
    fontWeight: "600",
  },

  bold: {
    fontWeight: "900",
    color: "#020617",
  },

  green: {
    color: "#16A34A",
  },

  payBtn: {
    backgroundColor: "#0F766E",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
