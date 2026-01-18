import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/context/CartContext";


type Props = {
  subtotal: number; // taxable (or fallback)
  gst: number;      // total gst included (or fallback)
  cgst?: number;
  sgst?: number;
  discount: number;
  delivery: number;
  total: number;    // payable inclusive
  onCheckout: () => void;
};

export default function PriceDetailsCard({
  subtotal,
  gst,
  cgst = 0,
  sgst = 0,
  discount,
  delivery,
  total,
  onCheckout,
}: Props) {
  const [open, setOpen] = useState(false);

  const { isGuest } = useCart();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((p) => !p);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Price Details</Text>

          { !isGuest && (
          <TouchableOpacity style={styles.breakupBtn} onPress={toggle}>
            <Text style={styles.breakupText}>
              {open ? "Hide breakup" : "Show breakup"}
            </Text>
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={16}
              color="#4F46E5"
            />
          </TouchableOpacity>
          )}

        </View>

        {/* POS total (primary) */}
        <Row
          label="Total Payable (Incl. GST)"
          value={`₹${Number(total).toFixed(2)}`}
          bold
        />

        {/* BREAKUP */}
        {open && (
          <View style={styles.breakupBox}>
            <Row label="Taxable Amount" value={`₹${Number(subtotal).toFixed(2)}`} />
            <Row label="GST Included" value={`₹${Number(gst).toFixed(2)}`} />
            <Row label="CGST" value={`₹${Number(cgst).toFixed(2)}`} />
            <Row label="SGST" value={`₹${Number(sgst).toFixed(2)}`} />

            {discount > 0 && (
              <Row
                label="Discount"
                value={`-₹${Number(discount).toFixed(2)}`}
                green
              />
            )}

            {delivery > 0 && (
              <Row
                label="Delivery"
                value={`₹${Number(delivery).toFixed(2)}`}
              />
            )}

            <Text style={styles.note}>
              Prices are GST inclusive
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Row = ({ label, value, bold, green }: any) => (
  <View style={styles.row}>
    <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
    <Text style={[styles.value, bold && styles.bold, green && styles.green]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  // ✅ fixed bottom sheet style
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  breakupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  breakupText: {
    color: "#4F46E5",
    fontWeight: "900",
  },

  breakupBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },

  note: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  label: {
    color: "#475569",
    fontWeight: "700",
  },

  value: {
    fontWeight: "900",
    color: "#0F172A",
  },

  bold: {
    fontWeight: "900",
    color: "#0F172A",
  },

  green: {
    color: "#16A34A",
  },

  checkoutBtn: {
    marginTop: 10,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
