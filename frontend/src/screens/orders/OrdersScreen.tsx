import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/api/axios";

type Order = {
  id: number;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  mall_name: string;
};

type FilterType = "ALL" | "PAID" | "PENDING" | "CANCELLED";
type SortType = "NEW" | "OLD" | "HIGH" | "LOW";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> =
  {
    PAID: { label: "Paid", color: "#16A34A", bg: "#DCFCE7" },
    PAYMENT_PENDING: { label: "Pending", color: "#D97706", bg: "#FEF3C7" },
    CREATED: { label: "Created", color: "#2563EB", bg: "#DBEAFE" },
    CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
    EXPIRED: { label: "Expired", color: "#6B7280", bg: "#E5E7EB" },
    FULFILLED: { label: "Fulfilled", color: "#0284C7", bg: "#E0F2FE" },
  };

export default function OrdersScreen({ navigation }: any) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const theme = useMemo(() => {
    return {
      bg: isDark ? "#020617" : "#F1F5F9",
      headerBg: isDark ? "#0B1220" : "#FFFFFF",
      cardBg: isDark ? "#0F172A" : "#FFFFFF",
      inputBg: isDark ? "#0F172A" : "#FFFFFF",
      border: isDark ? "#1E293B" : "#E2E8F0",
      text: isDark ? "#F8FAFC" : "#020617",
      subText: isDark ? "#94A3B8" : "#64748B",
      muted: isDark ? "#475569" : "#94A3B8",
      accent: "#0F766E",
      accentSoft: isDark ? "#052E2B" : "#d8f3edff",
      price: "#4F46E5",
      modalBg: isDark ? "#0B1220" : "#FFFFFF",
      overlay: "rgba(0,0,0,0.35)",
    };
  }, [isDark]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("NEW");
  const [search, setSearch] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    /**
     * ✅ your axios interceptor returns response.data directly
     * backend may return:
     * A) envelope: { success, message, data }
     * B) direct array: [ ...orders ]
     */
    const res: any = await api.get("orders/list/");

    const ok = res?.success ?? true;
    const data = res?.data ?? res;

    if (!ok) throw new Error(res?.message || "Unable to fetch orders");

    setOrders(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchOrders()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchOrders]);

  // ✅ swipe to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  /* SEARCH + FILTER + SORT */
  const processed = useMemo(() => {
    let data = [...orders];

    // filter
    if (filter !== "ALL") {
      data = data.filter((o) =>
        filter === "PAID"
          ? o.status === "PAID"
          : filter === "PENDING"
          ? o.status === "PAYMENT_PENDING"
          : o.status === "CANCELLED"
      );
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.mall_name.toLowerCase().includes(q)
      );
    }

    // sort
    data.sort((a, b) => {
      if (sort === "NEW") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === "OLD") return +new Date(a.created_at) - +new Date(b.created_at);

      const at = Number(a.total);
      const bt = Number(b.total);

      if (sort === "HIGH") return bt - at;
      return at - bt;
    });

    return data;
  }, [orders, filter, sort, search]);

  /* GROUP BY DATE (FLATTENED) */
  const listData = useMemo(() => {
    const rows: any[] = [];
    processed.forEach((o) => {
      const date = new Date(o.created_at).toDateString();
      if (!rows.find((r) => r.id === date)) {
        rows.push({ type: "DATE", id: date, date });
      }
      rows.push({ type: "ORDER", id: `o-${o.id}`, order: o });
    });
    return rows;
  }, [processed]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Orders</Text>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.subText} />

        <TextInput
          placeholder="Search by order or mall"
          placeholderTextColor={theme.subText}
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {/* clear / mic */}
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={theme.muted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="mic-outline" size={18} color={theme.accent} />
        )}
      </View>

      {/* FILTER BAR */}
      <View style={styles.bar}>
        <Dropdown
          theme={theme}
          label={`Filter: ${filter}`}
          onToggle={() => setFilterOpen(true)}
        />
        <Dropdown
          theme={theme}
          label={`Sort: ${sort}`}
          onToggle={() => setSortOpen(true)}
        />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
          }
          renderItem={({ item }) => {
            if (item.type === "DATE") {
              return <Text style={[styles.date, { color: theme.subText }]}>{item.date}</Text>;
            }

            const o: Order = item.order;
            const s = STATUS_META[o.status] || {
              label: o.status,
              color: theme.subText,
              bg: isDark ? "#0B1220" : "#E2E8F0",
            };

            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("OrderDetails", { orderId: o.id })}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mall, { color: theme.text }]} numberOfLines={1}>
                      {o.mall_name}
                    </Text>
                    <Text style={[styles.orderNo, { color: theme.subText }]}>{o.order_number}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.price, { color: theme.price }]}>₹{o.total}</Text>

                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isDark ? "#0B1220" : s.bg,
                          borderColor: theme.border,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text style={{ color: isDark ? theme.subText : s.color, fontWeight: "800", fontSize: 12 }}>
                        {s.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.muted }]}>No orders found</Text>
          }
        />
      )}

      {/* MODALS */}
      <OptionModal
        theme={theme}
        visible={filterOpen}
        title="Filter Orders"
        options={["ALL", "PAID", "PENDING", "CANCELLED"]}
        onSelect={(v: FilterType) => {
          setFilter(v);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <OptionModal
        theme={theme}
        visible={sortOpen}
        title="Sort Orders"
        options={[
          { k: "NEW", l: "Newest" },
          { k: "OLD", l: "Oldest" },
          { k: "HIGH", l: "High Amount" },
          { k: "LOW", l: "Low Amount" },
        ]}
        onSelect={(v: SortType) => {
          setSort(v);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
      />
    </SafeAreaView>
  );
}

function Dropdown({ label, onToggle, theme }: any) {
  return (
    <TouchableOpacity
      style={[styles.dropdown, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <Text style={[styles.dropdownText, { color: theme.text }]}>{label}</Text>
      <Ionicons name="chevron-down" size={16} color={theme.text} />
    </TouchableOpacity>
  );
}

function OptionModal({ visible, title, options, onSelect, onClose, theme }: any) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <View style={[styles.modal, { backgroundColor: theme.modalBg, borderColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>

          {options.map((o: any) => {
            const key = o.k || o;
            const label = o.l || o;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.modalItem, { borderColor: theme.border }]}
                onPress={() => onSelect(key)}
              >
                <Text style={[styles.modalText, { color: theme.text }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
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
    fontSize: 20,
    fontWeight: "900",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },

  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "space-between",
  },
  dropdownText: { fontWeight: "800", fontSize: 13 },

  date: {
    paddingHorizontal: 16,
    paddingTop: 16,
    fontWeight: "800",
  },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  mall: { fontSize: 16, fontWeight: "900" },
  orderNo: { fontSize: 12, marginTop: 8, fontWeight: "700" },

  price: {
    fontSize: 16,
    fontWeight: "900",
  },

  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  empty: {
    textAlign: "center",
    marginTop: 80,
    fontWeight: "700",
  },

  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  modal: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", marginBottom: 12 },
  modalItem: { paddingVertical: 12, borderTopWidth: 1 },
  modalText: { fontSize: 14, fontWeight: "700" },
});
