import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
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

const STATUS_META: any = {
  PAID: { label: "Paid", color: "#16A34A", bg: "#DCFCE7" },
  PAYMENT_PENDING: { label: "Pending", color: "#D97706", bg: "#FEF3C7" },
  CREATED: { label: "Created", color: "#2563EB", bg: "#DBEAFE" },
  CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("NEW");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    api.get("orders/list/").then(res => setOrders(res.data));
  }, []);

  /* SEARCH + FILTER + SORT */
  const processed = useMemo(() => {
    let data = [...orders];

    if (filter !== "ALL") {
      data = data.filter(o =>
        filter === "PAID"
          ? o.status === "PAID"
          : filter === "PENDING"
            ? o.status === "PAYMENT_PENDING"
            : o.status === "CANCELLED"
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        o =>
          o.order_number.toLowerCase().includes(q) ||
          o.mall_name.toLowerCase().includes(q)
      );
    }

    data.sort((a, b) => {
      if (sort === "NEW")
        return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === "OLD")
        return +new Date(a.created_at) - +new Date(b.created_at);
      if (sort === "HIGH") return +b.total - +a.total;
      return +a.total - +b.total;
    });

    return data;
  }, [orders, filter, sort, search]);

  /* GROUP BY DATE (FLATTENED) */
  const listData = useMemo(() => {
    const rows: any[] = [];
    processed.forEach(o => {
      const date = new Date(o.created_at).toDateString();
      if (!rows.find(r => r.id === date)) {
        rows.push({ type: "DATE", id: date, date });
      }
      rows.push({ type: "ORDER", id: `o-${o.id}`, order: o });
    });
    return rows;
  }, [processed]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#64748B"
        />

        <TextInput
          placeholder="Search by order or mall"
          placeholderTextColor="#64748B"
          style={styles.searchInput}
          value={search}
          editable={!!setSearch}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {/* ❌ Clear button */}
        {search.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearch?.("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="#94A3B8"
            />
          </TouchableOpacity>
        ) : (
          <Ionicons
            name="mic-outline"
            size={18}
            color="#0F766E"
          />
        )}
      </View>

      {/* FILTER BAR */}
      <View style={styles.bar}>
        <Dropdown
          label={`Filter: ${filter}`}
          open={filterOpen}
          onToggle={() => setFilterOpen(true)}
        />
        <Dropdown
          label={`Sort: ${sort}`}
          open={sortOpen}
          onToggle={() => setSortOpen(true)}
        />
      </View>

      {/* LIST */}
      <FlatList
        data={listData}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => {
          if (item.type === "DATE") {
            return <Text style={styles.date}>{item.date}</Text>;
          }

          const o = item.order;
          const s = STATUS_META[o.status];

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("OrderDetails", { orderId: o.id })
              }
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mall}>{o.mall_name}</Text>
                  <Text style={styles.orderNo}>{o.order_number}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.price}>₹{o.total}</Text>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={{ color: s.color, fontWeight: "700", fontSize: 12 }}>
                      {s.label}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders found</Text>
        }
      />

      {/* MODALS */}
      <OptionModal
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


function Dropdown({ label, onToggle }: any) {
  return (
    <TouchableOpacity style={styles.dropdown} onPress={onToggle}>
      <Text style={styles.dropdownText}>{label}</Text>
      <Ionicons name="chevron-down" size={16} />
    </TouchableOpacity>
  );
}

function OptionModal({ visible, title, options, onSelect, onClose }: any) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>

          {options.map((o: any) => {
            const key = o.k || o;
            const label = o.l || o;
            return (
              <TouchableOpacity
                key={key}
                style={styles.modalItem}
                onPress={() => onSelect(key)}
              >
                <Text style={styles.modalText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F5F9" },

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
    fontSize: 20,
    fontWeight: "800",
  },
  dropdownText: { fontWeight: "600" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
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
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#d8f3edff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },

  date: {
    paddingHorizontal: 16,
    paddingTop: 16,
    fontWeight: "700",
    color: "#475569",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,              // ✅ increased height
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  mall: { fontSize: 16, fontWeight: "700", color: "#020617" },
  orderNo: { fontSize: 12, color: "#64748B", marginTop: 10 },

  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",        // ✅ highlight color
  },

  badge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },

  empty: {
    textAlign: "center",
    marginTop: 80,
    color: "#94A3B8",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 32,
  },
  modal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  modalItem: { paddingVertical: 12 },
  modalText: { fontSize: 14 },
});

