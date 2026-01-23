// ProductDetailsScreen.tsx (screen name: MallProductDetails)
// ✅ Fetch by UUID: api.get(`products/${uuid}/`)
// ✅ Navigate with: navigation.navigate("MallProductDetails", { productId: item.id, mallId })
// ✅ Premium UI: sticky CTA, glass header, price + discount, stock chips, barcode copy, shimmer-like skeleton
// ✅ Image fallback: first letter if image missing

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Platform,
  StatusBar,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import api from "@/api/axios";

type Product = {
  id: string;
  name: string;
  barcode: string;
  description?: string | null;
  price: string; // Decimal from backend serialized as string
  marked_price: string;
  discount_percentage: string;
  image?: string | null;

  category_name?: string;
  mall_name?: string;

  stock_quantity: number;
  is_available: boolean;

  gst_rate?: string;
  hsn_code?: string | null;
};

export default function ProductDetailsScreen({ route, navigation }: any) {
  const productId: string | undefined = route?.params?.productId;
  const mallId: string | undefined = route?.params?.mallId;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);

      // ✅ Your API call
      const res = await api.get(`products/${productId}/`);

      // handle: {success, data} OR direct object
      const data: Product = res.data?.data ?? res.data;

      setProduct(data ?? null);
    } catch (e: any) {
      console.log("DETAIL ERROR:", e?.response?.data || e?.message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      navigation.goBack();
      return;
    }
    fetchDetails();
  }, [productId, fetchDetails, navigation]);

  const price = useMemo(() => Number(product?.price ?? 0), [product]);
  const mrp = useMemo(() => Number(product?.marked_price ?? 0), [product]);
  const youSave = useMemo(() => Math.max(mrp - price, 0), [mrp, price]);

  const imageLetter = useMemo(
    () => product?.name?.trim()?.[0]?.toUpperCase() ?? "?",
    [product?.name]
  );

  const canBuy = !!product?.is_available && (product?.stock_quantity ?? 0) > 0;

  const onShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name}\nPrice: ₹${product.price}\nMall: ${product.mall_name ?? ""}`,
      });
    } catch {
      // ignore
    }
  };

  const copyBarcode = async () => {
    if (!product?.barcode) return;
    await Clipboard.setStringAsync(product.barcode);
    Alert.alert("Copied", "Barcode copied to clipboard");
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading product…</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={{ fontWeight: "900", fontSize: 16 }}>Product not found</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Floating Top Bar */}
      {/* <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              Alert.alert("Saved", "Added to wishlist (connect API later).")
            }
            activeOpacity={0.85}
          >
            <Ionicons name="heart-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hero Image */}
        <View style={styles.hero}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackText}>{imageLetter}</Text>
            </View>
          )}

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeAccent]}>
              <Ionicons name="pricetag-outline" size={14} color="#065F46" />
              <Text style={[styles.badgeText, { color: "#065F46" }]}>
                {product.discount_percentage}% OFF
              </Text>
            </View>

            <View style={[styles.badge, canBuy ? styles.badgeSuccess : styles.badgeDanger]}>
              <Ionicons
                name={canBuy ? "checkmark-circle-outline" : "close-circle-outline"}
                size={14}
                color={canBuy ? "#166534" : "#991B1B"}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: canBuy ? "#166534" : "#991B1B" },
                ]}
              >
                {canBuy ? "In Stock" : "Out of Stock"}
              </Text>
            </View>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.mallText}>{product.mall_name ?? "Mall"}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {product.name}
          </Text>

          {!!product.category_name && (
            <Text style={styles.subtitle}>{product.category_name}</Text>
          )}

          {/* Price Block */}
          <View style={styles.priceBlock}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <Text style={styles.price}>₹{price.toFixed(2)}</Text>
              {mrp > price && <Text style={styles.mrp}>₹{mrp.toFixed(2)}</Text>}
            </View>

            {youSave > 0 ? (
              <Text style={styles.saveText}>You save ₹{youSave.toFixed(2)}</Text>
            ) : (
              <Text style={styles.taxText}>Inclusive of all taxes</Text>
            )}
          </View>

          {/* Quick Info Pills */}
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Ionicons name="barcode-outline" size={16} color="#0F766E" />
              <Text style={styles.pillText} numberOfLines={1}>
                {product.barcode}
              </Text>

              <Pressable onPress={copyBarcode} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={15} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.pill}>
              <Ionicons name="cube-outline" size={16} color="#0F766E" />
              <Text style={styles.pillText}>
                {product.stock_quantity} pcs
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this product</Text>
            <Text style={styles.desc}>
              {product.description?.trim()
                ? product.description
                : "No description available for this product."}
            </Text>
          </View>

          {/* Compliance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product details</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>GST Rate</Text>
              <Text style={styles.metaValue}>{product.gst_rate ?? "18.00"}%</Text>
            </View>

            {/* <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>HSN Code</Text>
              <Text style={styles.metaValue}>{product.hsn_code ?? "—"}</Text>
            </View> */}

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Availability</Text>
              <Text style={styles.metaValue}>
                {product.is_available ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>

          {/* Trust Row */}
          {/* <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#0F766E" />
              <Text style={styles.trustText}>Genuine</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="refresh-outline" size={18} color="#0F766E" />
              <Text style={styles.trustText}>Easy Returns</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="call-outline" size={18} color="#0F766E" />
              <Text style={styles.trustText}>Support</Text>
            </View>
          </View> */}
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      {/* <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          <Text style={styles.bottomPrice}>₹{price.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canBuy}
          onPress={() => {
            if (!canBuy) return;
            Alert.alert("Added", "Added to cart (connect API later).");
          }}
          style={[styles.ctaBtn, !canBuy && { opacity: 0.5 }]}
        >
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.ctaText}>{canBuy ? "Add to Cart" : "Out of Stock"}</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1F5F9" },

  loadingWrap: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#475569", fontWeight: "700" },

  topBar: {
    position: "absolute",
    zIndex: 50,
    top: Platform.OS === "android" ? 35 : 55,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    pointerEvents: "box-none",
  },
  topActions: { flexDirection: "row", gap: 10 },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  hero: {
    backgroundColor: "#E6F4F1",
    paddingTop: Platform.OS === "android" ? 62 : 92,
    paddingBottom: 14,
    // borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    // borderBottomRightRadius: 24,
  },

  heroImage: {
    width: "83%",
    height: 320,
    resizeMode: "contain",
    backgroundColor: "#fff",
    borderRadius: 24,
  },

  heroFallback: {
    width: "83%",
    height: 320,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  
  heroFallbackText: {
    fontSize: 88,
    fontWeight: "900",
    color: "#334155",
    lineHeight: 92,
  },

  badgeRow: {
    marginTop: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 20,
  },

  badge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c0cee0",
  },
  badgeText: { fontWeight: "900", fontSize: 12 },

  badgeAccent: { backgroundColor: "#DCFCE7" },
  badgeSuccess: { backgroundColor: "#DCFCE7" },
  badgeDanger: { backgroundColor: "#FEE2E2" },

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  mallText: { color: "#0F766E", fontWeight: "900", fontSize: 12, letterSpacing: 0.4 },
  title: { marginTop: 6, fontSize: 18, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 6, color: "#64748B", fontWeight: "700" },

  priceBlock: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  price: { fontSize: 26, fontWeight: "900", color: "#131414" },
  mrp: {
    fontSize: 14,
    fontWeight: "800",
    color: "#94A3B8",
    textDecorationLine: "line-through",
    paddingBottom: 3,
  },
  saveText: { marginTop: 6, fontWeight: "800", color: "#85c8c6" },
  taxText: { marginTop: 6, fontWeight: "700", color: "#64748B", fontSize: 12 },

  pillsRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  pillText: { flex: 1, fontWeight: "800", color: "#0F172A", fontSize: 12 },

  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  desc: { marginTop: 8, color: "#475569", lineHeight: 20, fontWeight: "600" },

  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  metaLabel: { color: "#64748B", fontWeight: "800" },
  metaValue: { color: "#0F172A", fontWeight: "900" },

  trustRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  trustItem: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  trustText: { fontWeight: "900", color: "#0F172A", fontSize: 12 },

  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  bottomPriceLabel: { color: "#64748B", fontWeight: "800", fontSize: 12 },
  bottomPrice: { color: "#0F172A", fontWeight: "900", fontSize: 16, marginTop: 2 },

  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0F766E",
    minWidth: 170,
  },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  backBtn: {
    marginTop: 14,
    backgroundColor: "#0F766E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
