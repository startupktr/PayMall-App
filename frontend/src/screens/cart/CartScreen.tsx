import React, { useEffect, useCallback, useState } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useCart } from "@/context/CartContext";
import { useMall } from "@/context/MallContext";
import { useAuth } from "@/context/AuthContext";
import PriceDetailsCard from "@/components/PriceDetailsCard";
import { postLoginRedirect } from "@/lib/postLoginRedirect";

export default function CartScreen() {
  const navigation = useNavigation<any>();

  const { selectedMall } = useMall();
  const { user } = useAuth();

  const { cart, fetchCart, updateItem, removeItem, clearCart, count, isGuest } =
    useCart();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mallId = selectedMall?.id;
  
  useFocusEffect(
    useCallback(() => {
      if (!mallId) return;
      fetchCart(); // ✅ always fetch latest cart when Cart page opens
    }, [mallId])
  );

  useEffect(() => {
    loadCart();
  }, [mallId]);

  const loadCart = async () => {
    setLoading(true);

    if (!mallId) {
      setLoading(false);
      return;
    }

    await fetchCart();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const hasItems = (cart?.items?.length || 0) > 0;

  const payableTotal = Number(cart?.total_amount || 0);
  const displaySubtotal = Number(cart?.taxable_subtotal || 0);
  const displayTax = Number(cart?.gst_total || 0);

  const discount = 0;
  const delivery = 0;

  const displayTotal = payableTotal || displaySubtotal + displayTax;

  const askLoginForCheckout = async () => {
    if (!mallId) {
      Alert.alert("Select Mall", "Please select a mall first.");
      return;
    }

    // ✅ save intent
    await postLoginRedirect.set({
      type: "CART_CHECKOUT",
      payload: { mallId },
    });

    Alert.alert(
      "Login Required",
      "Please login to proceed with checkout and payment.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Login Now",
          onPress: () => {
            navigation.navigate("Auth", {
              screen: "Login",
            });
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (!hasItems) return;

    // ✅ guest checkout blocked
    if (!user || isGuest) {
      await askLoginForCheckout();
      return;
    }
    
    // ✅ logged-in checkout
    navigation.navigate("Checkout", { mall_id: mallId });
  };

  if (!selectedMall) {
    return (
      <SafeAreaView style={styles.empty}>
        <Ionicons name="storefront-outline" size={70} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Select a mall first</Text>
        <Text style={styles.emptySub}>
          You need to choose a mall to view and manage your cart.
        </Text>
      </SafeAreaView>
    );
  }

  if (!loading && !hasItems) {
    return (
      <SafeAreaView style={styles.empty}>
        <Ionicons name="cart-outline" size={80} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Scan products to add them</Text>
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

          <View>
            <Text style={styles.headerTitle}>My Cart ({count})</Text>
            <Text style={styles.mallName}>{selectedMall.name}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() =>
            Alert.alert("Clear Cart", "Remove all items?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart },
            ])
          }
        >
          <Text style={styles.clear}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* INFO STRIP */}
      {isGuest && (
        <View style={styles.guestStrip}>
          <Ionicons name="person-outline" size={16} color="#0F766E" />
          <Text style={styles.guestText}>
            Guest cart • Login required for checkout
          </Text>
        </View>
      )}

      {/* ITEMS */}
      <FlatList
        data={cart?.items}
        keyExtractor={(i) => Number(i.id).toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 240 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.product.image ? (
              <Image source={{ uri: item.product.image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {item.product.name?.[0] || "P"}
                </Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.product.name}
              </Text>

              <Text style={styles.price}>
                ₹{Number(item.product.price).toFixed(2)} (Incl. GST)
              </Text>

              {/* QTY */}
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
                ₹{(Number(item.product.price) * Number(item.quantity)).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      />

      {hasItems && (
        <PriceDetailsCard
          cgst={Number(cart?.cgst ?? 0)}
          sgst={Number(cart?.sgst ?? 0)}
          gst={Number(cart?.gst_total ?? 0)}
          discount={discount}
          delivery={delivery}
          subtotal={Number(cart?.taxable_subtotal ?? 0)}
          total={Number(cart?.total_amount ?? displayTotal)}
          onCheckout={handleCheckout}
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
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  mallName: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "700" },
  clear: { color: "#EF4444", fontWeight: "800" },

  guestStrip: {
    margin: 16,
    marginBottom: 6,
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guestText: {
    color: "#0F766E",
    fontWeight: "800",
    fontSize: 12,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  image: { width: 70, height: 70, borderRadius: 14 },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#4F46E5",
  },

  info: { flex: 1 },
  name: { fontWeight: "900", color: "#0F172A" },
  price: { marginTop: 4, color: "#16A34A", fontWeight: "900", fontSize: 13 },

  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    marginTop: 10,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
  },
  qtyText: { fontWeight: "900", marginHorizontal: 10, color: "#0F172A" },

  right: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  itemTotal: { fontWeight: "900", marginTop: 12, color: "#0F172A" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", marginTop: 12, color: "#0F172A" },
  emptySub: { color: "#64748B", marginTop: 6, textAlign: "center" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
