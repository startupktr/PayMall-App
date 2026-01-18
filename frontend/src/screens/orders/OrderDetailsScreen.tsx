import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import api from "@/api/axios";
import { Ionicons } from "@expo/vector-icons";
import DownloadInvoiceButton from "@/lib/downloadInvoice";

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
  subtotal: string;
  tax: string;
  total: string;
  created_at: string;
  items: OrderItem[];
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> =
{
  CREATED: { label: "Order Created", color: "#2563EB", bg: "#DBEAFE" },
  PAYMENT_PENDING: {
    label: "Payment Pending",
    color: "#D97706",
    bg: "#FEF3C7",
  },
  PAID: { label: "Paid", color: "#16A34A", bg: "#DCFCE7" },
  CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
  EXPIRED: { label: "Expired", color: "#6B7280", bg: "#E5E7EB" },
};

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { orderId } = route.params;

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // ✅ Theme colors (centralized)
  const theme = useMemo(() => {
    return {
      bg: isDark ? "#020617" : "#F8FAFC",
      headerBg: isDark ? "#0B1220" : "#FFFFFF",
      cardBg: isDark ? "#0F172A" : "#FFFFFF",
      border: isDark ? "#1E293B" : "#E2E8F0",
      text: isDark ? "#F8FAFC" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      divider: isDark ? "#1E293B" : "#E2E8F0",
      btnBg: "#0F766E",
      btnText: "#FFFFFF",
    };
  }, [isDark]);

  const fetchOrder = useCallback(async () => {
    /**
     * ✅ Your axios interceptor returns response.data directly
     * backend may return:
     * A) envelope: { success, message, data }
     * B) direct: { id, order_number, ... }
     */
    const res: any = await api.get(`orders/${orderId}/`);

    const ok = res?.success ?? true;
    const data = res?.data ?? res;

    if (!ok || !data?.id) {
      throw new Error(res?.message || "Unable to fetch order");
    }

    setOrder(data);
  }, [orderId]);

  useEffect(() => {
    fetchOrder()
      .catch((e: any) => Alert.alert("Error", e?.message || "Unable to load order"))
      .finally(() => setLoading(false));
  }, [fetchOrder]);

  // ✅ Pull-to-refresh
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchOrder();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Unable to refresh");
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrder]);

  const statusMeta = useMemo(() => {
    if (!order) return STATUS_MAP.CREATED;
    return STATUS_MAP[order.status] || STATUS_MAP.CREATED;
  }, [order]);

  const canRetryPayment = useMemo(() => {
    if (!order) return false;
    return order.status === "PAYMENT_PENDING";
  }, [order]);

  const canDownloadInvoice = useMemo(() => {
    if (!order) return false;
    return order.status === "PAID";
  }, [order]);

  const retryPayment = async () => {
    if (!order) return;

    navigation.navigate("Main", {
      screen: "CartTab",
      params: {
        screen: "Payment",
        params: {
          orderId: order.id, // ✅ only orderId needed
        },
      },
    });
  };


  if (loading || !order) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={isDark ? "#93C5FD" : "#2563EB"} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text} // iOS spinner color
          />
        }
      >
        {/* ORDER NUMBER */}
        <Text style={[styles.orderNo, { color: theme.text }]}>
          {order.order_number}
        </Text>

        {/* STATUS CHIP */}
        <View
          style={[
            styles.statusChip,
            {
              backgroundColor: isDark ? "#0B1220" : statusMeta.bg,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={{ color: isDark ? theme.subText : statusMeta.color, fontWeight: "900" }}>
            {statusMeta.label}
          </Text>
        </View>

        {/* ITEMS */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Items</Text>

          {order.items?.map((item) => (
            <View key={item.id} style={[styles.itemRow, { borderColor: theme.divider }]}>
              <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                {item.quantity} × {item.product_name}
              </Text>
              <Text style={[styles.itemPrice, { color: theme.text }]}>
                ₹{item.total_price}
              </Text>
            </View>
          ))}
        </View>

        {/* BILL */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Bill Summary</Text>

          <Row label="Taxable Value" value={order.subtotal} theme={theme} />
          <Row label="GST" value={order.tax} theme={theme} />
          <Row label="Total Payable" value={order.total} bold theme={theme} />
        </View>

        {/* RETRY */}
        {canRetryPayment && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.btnBg }, retrying && { opacity: 0.7 }]}
            onPress={retryPayment}
            disabled={retrying}
            activeOpacity={0.9}
          >
            {retrying ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.primaryText, { color: theme.btnText }]}>Retry Payment</Text>
            )}
          </TouchableOpacity>
        )}

        {/* INVOICE */}
        {canDownloadInvoice && (
          <DownloadInvoiceButton order={order} buttonText="Get Invoice PDF" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
  theme,
}: {
  label: string;
  value: string;
  bold?: boolean;
  theme: {
    text: string;
    subText: string;
  };
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.rowText, { color: theme.subText }, bold && { fontWeight: "900", color: theme.text }]}>
        {label}
      </Text>
      <Text style={[styles.rowText, { color: theme.text }, bold && { fontWeight: "900" }]}>
        ₹{value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
  },

  container: { padding: 20, paddingBottom: 140 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  orderNo: { fontSize: 22, fontWeight: "900" },

  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },

  card: {
    borderRadius: 10,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 12 },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: { fontSize: 14, flex: 1, paddingRight: 10 },
  itemPrice: { fontSize: 14, fontWeight: "800" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  rowText: { fontSize: 14 },

  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 26,
    alignItems: "center",
  },
  primaryText: { fontSize: 16, fontWeight: "900" },
});
