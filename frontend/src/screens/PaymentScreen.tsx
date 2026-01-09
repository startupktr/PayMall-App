import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function PaymentScreen({ route, navigation }: any) {
    const { orderId, amount } = route.params;
    const [payment, setPayment] = useState("");

    const payNow = async () => {

        const res = await api.post("/payments/initiate/", {
            order_id: orderId,
            provider: "UPI",
        });

        navigation.replace("PaymentProcessing", {
            paymentId: res.data.payment_id,
        });

    };

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={22} />
                <Text style={styles.headerTitle}>Payment</Text>
            </View>
            {/* PAYMENT METHODS */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Select Payment Method</Text>

                <PaymentOption
                    icon="card-outline"
                    title="Credit Card"
                    subtitle="**** **** **** 1234"
                    selected={payment === "card"}
                    onPress={() => setPayment("card")}
                />

                <PaymentOption
                    icon="wallet-outline"
                    title="UPI"
                    subtitle="user@upi"
                    selected={payment === "upi"}
                    onPress={() => setPayment("upi")}
                />

                <PaymentOption
                    icon="cash-outline"
                    title="Cash"
                    subtitle="Pay at checkout"
                    selected={payment === "cash"}
                    onPress={() => setPayment("cash")}
                />
            </View>

            <TouchableOpacity style={styles.payBtn} onPress={payNow}>
                <Text style={styles.payText}>Pay ₹{amount}</Text>
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
            style={[
                styles.paymentRow,
                selected && styles.paymentSelected,
            ]}
            onPress={onPress}
        >
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={20} />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>{title}</Text>
                <Text style={styles.paymentSub}>{subtitle}</Text>
            </View>

            {selected && (
                <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#16A34A"
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { fontSize: 20, fontWeight: "800", marginBottom: 24 },
    payBtn: {
        backgroundColor: "#0F766E",
        margin: 16,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    payText: { color: "#fff", fontWeight: "800" },

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
    paymentRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        marginBottom: 12,
    },

    paymentSelected: {
        borderColor: "#16A34A",
        backgroundColor: "#ECFDF5",
    },

    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },

    paymentTitle: {
        fontWeight: "700",
    },
    paymentSub: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
});
