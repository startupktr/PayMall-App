import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import api from "@/api/axios";

type Variant = {
  id: string;
  label: string;
  pricePerKg: number;
};

type TrustItemProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

type ProductDetails = {
  id: string;
  name: string;
  barcode?: string;
  description?: string;
  price: string;
  marked_price?: string;
  discount_percentage?: string;
  image?: string | null;
  category_name?: string;
  mall_name?: string;
  stock_quantity?: number;
  is_available?: boolean;
};

const variants: Variant[] = [
  { id: "1kg", label: "1 kg", pricePerKg: 55 },
  { id: "5kg", label: "5 kg", pricePerKg: 52.6 },
  { id: "10kg", label: "10 kg", pricePerKg: 51.4 },
];

const TrustItem: React.FC<TrustItemProps> = ({ label, style, textStyle }) => (
  <View style={[styles.trustItem, style]}>
    <Text style={[styles.trustText, textStyle]}>{label}</Text>
  </View>
);

export default function MallProductDetailsScreen({ route, navigation }: any) {
  const productId: string | undefined = route?.params?.productId;

  const [selectedVariant, setSelectedVariant] = useState<Variant>(variants[2]);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      navigation.goBack();
      return;
    }
    fetchProductDetails(productId);
  }, [productId]);

  const fetchProductDetails = async (uuid: string) => {
    try {
      setLoading(true);

      /**
       * ✅ IMPORTANT:
       * You need an endpoint like:
       * GET /api/products/<uuid>/
       *
       * If your backend endpoint is different, change this line.
       */
      const res = await api.get(`products/${uuid}/`);

      // ✅ handle: { success: true, data: {...} } OR direct product object
      const p = res.data?.data ?? res.data;
      setProduct(p ?? null);
    } catch (err) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const price = useMemo(() => Number(product?.price ?? 0), [product]);
  const mrp = useMemo(
    () => Number(product?.marked_price ?? product?.price ?? 0),
    [product]
  );
  const off = useMemo(() => (mrp > price ? mrp - price : 0), [mrp, price]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: "800" }}>Product not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const firstLetter = product?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ✅ Image if available else first letter */}
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.productImage} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>{firstLetter}</Text>
          </View>
        )}

        {/* Product Title */}
        <View style={styles.section}>
          <Text style={styles.brand}>{product.mall_name ?? "PayMall"}</Text>
          <Text style={styles.title}>
            {product.name} – {selectedVariant.label}
          </Text>
          {!!product.category_name && (
            <Text style={styles.subText}>{product.category_name}</Text>
          )}
        </View>

        {/* Price Section */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price}</Text>

          {mrp > price && (
            <>
              <Text style={styles.mrp}>₹{mrp}</Text>
              <View style={styles.offerBadge}>
                <Text style={styles.offerText}>₹{off} OFF</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.taxText}>Inclusive of all taxes</Text>

        {/* Variant Selector (demo) */}
        <View style={styles.variantRow}>
          {variants.map((item) => {
            const isSelected = selectedVariant.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[
                  styles.variantButton,
                  isSelected && styles.variantSelected,
                ]}
                onPress={() => setSelectedVariant(item)}
              >
                <Text
                  style={[
                    styles.variantLabel,
                    isSelected && styles.variantLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.unitPrice}>₹{item.pricePerKg}/kg</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          <TrustItem label="100% Genuine" />
          <TrustItem label="COD Available" />
          <TrustItem label="Easy Returns" />
        </View>

        {/* Stock */}
        <View style={styles.section}>
          <Text style={styles.stockText}>
            {product.is_available
              ? `In stock (${product.stock_quantity ?? 0})`
              : "Out of stock"}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.description}>
            {product.description?.trim()
              ? product.description
              : "No description available."}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Add to Cart */}
      <TouchableOpacity
        style={[styles.addToCart, !product.is_available && { opacity: 0.5 }]}
        disabled={!product.is_available}
        activeOpacity={0.9}
      >
        <Text style={styles.addToCartText}>
          {product.is_available ? "ADD TO CART" : "OUT OF STOCK"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

type Styles = {
  container: ViewStyle;
  center: ViewStyle;
  backBtn: ViewStyle;

  productImage: ImageStyle;
  imageFallback: ViewStyle;
  imageFallbackText: TextStyle;

  section: ViewStyle;
  brand: TextStyle;
  title: TextStyle;
  subText: TextStyle;

  priceRow: ViewStyle;
  price: TextStyle;
  mrp: TextStyle;
  offerBadge: ViewStyle;
  offerText: TextStyle;
  taxText: TextStyle;

  variantRow: ViewStyle;
  variantButton: ViewStyle;
  variantSelected: ViewStyle;
  variantLabel: TextStyle;
  variantLabelSelected: TextStyle;
  unitPrice: TextStyle;

  trustRow: ViewStyle;
  trustItem: ViewStyle;
  trustText: TextStyle;

  stockText: TextStyle;
  sectionTitle: TextStyle;
  description: TextStyle;

  addToCart: ViewStyle;
  addToCartText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  backBtn: {
    marginTop: 14,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  productImage: {
    width: "100%",
    height: 280,
    resizeMode: "contain",
    backgroundColor: "#fff",
  },

  imageFallback: {
    width: "100%",
    height: 280,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  imageFallbackText: {
    fontSize: 60,
    fontWeight: "900",
    color: "#334155",
  },

  section: { paddingHorizontal: 16, paddingTop: 16 },

  brand: { color: "#2e7d32", fontWeight: "700", fontSize: 14 },

  title: { fontSize: 18, fontWeight: "800", marginTop: 6, color: "#111" },

  subText: { marginTop: 6, color: "#64748B", fontWeight: "700" },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  price: { fontSize: 22, fontWeight: "900", color: "#2e7d32" },

  mrp: {
    marginLeft: 10,
    textDecorationLine: "line-through",
    color: "#888",
    fontSize: 14,
    fontWeight: "700",
  },

  offerBadge: {
    backgroundColor: "#ffe0b2",
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  offerText: { color: "#e65100", fontWeight: "800", fontSize: 12 },

  taxText: {
    paddingHorizontal: 16,
    paddingTop: 6,
    color: "#666",
    fontSize: 12,
  },

  variantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  variantButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },

  variantSelected: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },

  variantLabel: { fontSize: 13, fontWeight: "800", color: "#222" },

  variantLabelSelected: { color: "#2e7d32" },

  unitPrice: { fontSize: 12, color: "#555", marginTop: 4, fontWeight: "600" },

  trustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  trustItem: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },

  trustText: { fontSize: 12, fontWeight: "800", color: "#333" },

  stockText: { fontWeight: "900", color: "#2e7d32" },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#111" },

  description: {
    marginTop: 8,
    color: "#555",
    lineHeight: 20,
    fontSize: 13,
  },

  addToCart: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    alignItems: "center",
  },

  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
