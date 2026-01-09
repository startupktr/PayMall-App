import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import PriceDetailsCard from "../components/PriceDetailsCard";


export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { cart, fetchCart, updateItem, removeItem, clearCart, count } = useCart();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    await fetchCart();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  /* ================= PRICE CALC ================= */
  const hasItems = cart?.items?.length > 0;

  const subtotal =
    cart?.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    ) ?? 0;

  const discount = subtotal > 500 ? 50 : 0;
  const gst = Math.round(subtotal * 0.05);
  const delivery = subtotal > 500 ? 0 : 40;

  const total = subtotal - discount + gst + delivery;

  /* ================= EMPTY ================= */
  if (!loading && !hasItems) {
    return (
      <SafeAreaView style={styles.empty}>
        <Ionicons name="cart-outline" size={80} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>
          Scan products to add them
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Cart ({count})
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Clear Cart",
              "Remove all items?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: clearCart },
              ]
            )
          }
        >
          <Text style={styles.clear}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* ITEMS */}
      <FlatList
        data={cart?.items}
        keyExtractor={(i) => i.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 220 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.product.image ? (
              <Image source={{ uri: item.product.image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {item.product.name[0]}
                </Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>₹{item.product.price}</Text>

              {/* QTY CONTROLS */}
              <View style={styles.qtyPill}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateItem(item.id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={18} />
                </TouchableOpacity>

                <Text style={styles.qtyText}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateItem(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.right}>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>

              <Text style={styles.itemTotal}>
                ₹{item.product.price * item.quantity}
              </Text>
            </View>
          </View>
        )}
      />

      {hasItems && (
        <PriceDetailsCard
          subtotal={subtotal}
          discount={discount}
          gst={gst}
          delivery={delivery}
          total={total}
          onCheckout={() => {
            navigation.navigate("Checkout", {
              subtotal,
              discount,
              gst,
              total,
            });
          }}

        />
      )}

    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", gap: 12, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  clear: { color: "#EF4444", fontWeight: "600" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    elevation: 4,
  },

  image: { width: 70, height: 70, borderRadius: 12 },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2563EB",
  },

  info: { flex: 1 },
  name: { fontWeight: "600" },
  price: { marginTop: 4, color: "#16A34A", fontWeight: "700" },

  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qtyText: { fontWeight: "700", marginHorizontal: 6 },

  right: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  itemTotal: { fontWeight: "700", marginTop: 12 },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptySub: { color: "#64748B", marginTop: 4 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
