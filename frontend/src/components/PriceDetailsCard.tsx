import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  subtotal: number;
  discount: number;
  gst: number;
  delivery: number;
  total: number;
  onCheckout: () => void;
};

export default function PriceDetailsCard({
  subtotal,
  discount,
  gst,
  delivery,
  total,
  onCheckout,
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
    setOpen((p) => !p);
  };

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Price Details</Text>

        <TouchableOpacity
          style={styles.breakupBtn}
          onPress={toggle}
        >
          <Text style={styles.breakupText}>
            {open ? "Hide Breakup" : "Show Breakup"}
          </Text>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      {/* SUBTOTAL */}
      <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />

      {/* BREAKUP */}
      {open && (
        <>
          <Row
            label="Discount"
            value={`-₹${discount.toFixed(2)}`}
            green
          />
          <Row
            label="GST"
            value={`₹${gst.toFixed(2)}`}
          />
          <Row
            label="Delivery"
            value={
              delivery === 0 ? "Free" : `₹${delivery.toFixed(2)}`
            }
          />
        </>
      )}

      <View style={styles.divider} />

      {/* TOTAL */}
      <Row
        label="Total Amount"
        value={`₹${total.toFixed(2)}`}
        bold
      />

      {/* CTA */}
      <TouchableOpacity
        style={styles.checkoutBtn}
        onPress={onCheckout}
      >
        <Text style={styles.checkoutText}>
          Proceed to Checkout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- ROW ---------------- */
const Row = ({ label, value, bold, green }: any) => (
  <View style={styles.row}>
    <Text
      style={[
        styles.label,
        bold && styles.bold,
      ]}
    >
      {label}
    </Text>

    <Text
      style={[
        styles.value,
        bold && styles.bold,
        green && styles.green,
      ]}
    >
      {value}
    </Text>
  </View>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    bottom:-50
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  breakupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  breakupText: {
    color: "#2563EB",
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  label: {
    color: "#334155",
  },

  value: {
    fontWeight: "600",
  },

  bold: {
    fontWeight: "700",
  },

  green: {
    color: "#16A34A",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },

  checkoutBtn: {
    marginTop: 12,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
