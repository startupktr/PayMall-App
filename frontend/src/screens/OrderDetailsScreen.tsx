import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useColorScheme,
    RefreshControl,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/axios";
import { Ionicons } from "@expo/vector-icons";

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    total_price: string;
};

type OrderDetail = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    payment_method: string | null;
    subtotal: string;
    tax: string;
    total: string;
    created_at: string;
    items: OrderItem[];
};

const STATUS_MAP: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    CREATED: {
        label: "Order Created",
        color: "#2563EB",
        bg: "#DBEAFE",
    },
    PAYMENT_PENDING: {
        label: "Payment Pending",
        color: "#D97706",
        bg: "#FEF3C7",
    },
    PAID: {
        label: "Paid",
        color: "#16A34A",
        bg: "#DCFCE7",
    },
    CANCELLED: {
        label: "Cancelled",
        color: "#DC2626",
        bg: "#FEE2E2",
    },
    EXPIRED: {
        label: "Expired",
        color: "#6B7280",
        bg: "#E5E7EB",
    },
};

export default function OrderDetailsScreen({ route, navigation }: any) {
    const { orderId } = route.params;
    const isDark = useColorScheme() === "dark";

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [retrying, setRetrying] = useState(false);

    const fetchOrder = async () => {
        const res = await api.get(`orders/${orderId}/`);
        setOrder(res.data);
    };

    useEffect(() => {
        fetchOrder().finally(() => setLoading(false));
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrder();
        setRefreshing(false);
    }, []);

    if (loading || !order) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const canRetryPayment =
        order.status === "PAYMENT_PENDING" ||
        order.payment_status === "FAILED";

    const statusMeta = STATUS_MAP[order.status];

    const retryPayment = async () => {
        try {
            setRetrying(true);

            // 🔁 Idempotent retry (same order, safe)
            await api.post("/payments/initiate/", {
                order_id: order.id,
                provider: "UPI", // default, user can change on PaymentScreen
            });

            navigation.navigate("CartTab", {
                screen: "Payment",
                params: {
                    orderId: order.id,
                    amount: order.total,
                },
            });

        } catch (err: any) {
            Alert.alert(
                "Retry failed",
                err?.response?.data?.error || "Unable to retry payment"
            );
        } finally {
            setRetrying(false);
        }
    };

    return (
        <SafeAreaView
            style={[
                styles.safe,
                { backgroundColor: isDark ? "#020617" : "#FFF" },
            ]}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={22} />
                <Text style={styles.headerTitle}>Order Details</Text>
            </View>
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* HEADER */}
                <Text
                    style={[
                        styles.orderNo,
                        { color: isDark ? "#F8FAFC" : "#020617" },
                    ]}
                >
                    {order.order_number}
                </Text>

                <View
                    style={[
                        styles.statusChip,
                        { backgroundColor: statusMeta.bg },
                    ]}
                >
                    <Text style={{ color: statusMeta.color, fontWeight: "700" }}>
                        {statusMeta.label}
                    </Text>
                </View>

                {/* ITEMS */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Items</Text>

                    {order.items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.itemName}>
                                {item.quantity} × {item.product_name}
                            </Text>
                            <Text style={styles.itemPrice}>₹{item.total_price}</Text>
                        </View>
                    ))}
                </View>

                {/* PRICE BREAKUP */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Bill Summary</Text>

                    <Row label="Subtotal" value={order.subtotal} />
                    <Row label="Tax" value={order.tax} />
                    <Row label="Total" value={order.total} bold />
                </View>

                {/* RETRY PAYMENT */}
                {canRetryPayment && (
                    <TouchableOpacity
                        style={[
                            styles.primaryBtn,
                            retrying && { opacity: 0.6 },
                        ]}
                        onPress={retryPayment}
                        disabled={retrying}
                    >
                        {retrying ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.primaryText}>Retry Payment</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function Row({
    label,
    value,
    bold,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <View style={styles.rowBetween}>
            <Text style={[styles.rowText, bold && { fontWeight: "700" }]}>
                {label}
            </Text>
            <Text style={[styles.rowText, bold && { fontWeight: "700" }]}>
                ₹{value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: 20, paddingBottom: 140 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },

    orderNo: { fontSize: 22, fontWeight: "800" },
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
    statusChip: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginTop: 8,
    },

    card: {
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
    },
    sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    itemName: { fontSize: 14 },
    itemPrice: { fontSize: 14, fontWeight: "600" },

    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 6,
    },
    rowText: { fontSize: 14 },

    primaryBtn: {
        backgroundColor: "#0F766E",
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 32,
        alignItems: "center",
    },
    primaryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "800",
    },
});
