import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeHeader from "@/components/HomeHeader";
import api from "@/api/axios";
import OfferCarousel from "@/components/OfferCarousel";
import { Offer } from "@/types/offer";
import { useMall } from "@/context/MallContext";
import { useCart } from "@/context/CartContext";

/* ================= TYPES ================= */

type Product = {
  id: number;
  name: string;
  price: number;
  marked_price: number;
  image?: string | null;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null; // ✅ category image
};

const SORT_OPTIONS = [
  { label: "Popular", value: "popular" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
];

/* ================= SCREEN ================= */

export default function MallDetailsScreen({ route, navigation }: any) {
  const { mallId } = route.params;

  const { setSelectedMall } = useMall();
  const { fetchCart, cart } = useCart();

  /* ---------- DATA ---------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  /* ---------- UI ---------- */
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("__all__");
  const [sort, setSort] = useState("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mall, setMall] = useState<any>(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ✅ category auto-scroll
  const categoryListRef = useRef<FlatList<Category> | null>(null);

  // ✅ cache products per (mall + category + sort)
  const productsCacheRef = useRef<Record<string, Product[]>>({});

  /* ================= RESPONSIVE ================= */

  const { width } = Dimensions.get("window");

  const productColumns = useMemo(() => {
    if (width >= 900) return 4;
    if (width >= 768) return 3;
    return 2;
  }, [width]);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    fetchMallDetails();
    fetchCategories();
    fetchMallOffers();
    fetchProducts("__all__", "popular");
  }, [mallId]);

  // ✅ set mall in context + refresh cart for this mall
  useEffect(() => {
    if (!mall) return;

    setSelectedMall({
      id: mall.id,
      name: mall.name,
    });

    fetchCart();
  }, [mall]);

  /* ================= API ================= */

  const fetchMallDetails = async () => {
    const res = await api.get(`malls/${mallId}/`);
    setMall(res.data);
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const res = await api.get("products/categories/", {
        params: { mall: mallId },
      });

      setCategories([
        { id: -1, name: "All", slug: "__all__", image: null },
        ...(res.data || []),
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchMallOffers = async () => {
    const res = await api.get("malls/offers/", { params: { mall: mallId } });
    setOffers(res.data || []);
  };

  const fetchProducts = async (category: string, sortBy: string) => {
    const cacheKey = `${mallId}__${category}__${sortBy}`;

    // ✅ cache hit = instant (no re-fetch)
    if (productsCacheRef.current[cacheKey]) {
      setProducts(productsCacheRef.current[cacheKey]);
      setFilteredProducts(productsCacheRef.current[cacheKey]);
      return;
    }

    try {
      setLoadingProducts(true);

      const res = await api.get("products/list/", {
        params: {
          mall: mallId,
          category: category !== "__all__" ? category : undefined,
          sort: sortBy,
        },
      });

      const list: Product[] = res.data || [];

      // ✅ save cache
      productsCacheRef.current[cacheKey] = list;

      setProducts(list);
      setFilteredProducts(list);
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ================= SEARCH FILTER ================= */

  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products);
      return;
    }

    const q = search.toLowerCase();
    setFilteredProducts(products.filter((p) => p.name.toLowerCase().includes(q)));
  }, [search, products]);

  /* ================= HELPERS ================= */

  const getQtyInCart = (productId: number) => {
    return cart?.items?.find((x: any) => x.product.id === productId)?.quantity || 0;
  };

  /* ================= HANDLERS ================= */

  const onCategoryChange = (slug: string, index: number) => {
    setSelectedCategory(slug);
    fetchProducts(slug, sort);

    // ✅ auto scroll category bar to selected
    requestAnimationFrame(() => {
      categoryListRef.current?.scrollToIndex({
        index: Math.max(index - 1, 0),
        animated: true,
        viewPosition: 0.2,
      });
    });
  };

  const onSortChange = (value: string) => {
    setSort(value);
    fetchProducts(selectedCategory, value);
  };

  const onRefresh = async () => {
    setRefreshing(true);

    // ✅ clear only current category cache and refetch
    const cacheKey = `${mallId}__${selectedCategory}__${sort}`;
    delete productsCacheRef.current[cacheKey];

    await fetchProducts(selectedCategory, sort);
    setRefreshing(false);
  };

  /* ================= HEADER (stable + premium categories) ================= */

  const headerComponent = useMemo(() => {
    return (
      <>
        {/* Small mall name */}
        <View style={styles.mallHero}>
          <Text style={styles.mallTitle}>{mall?.name ?? "Mall"}</Text>
        </View>

        {/* Offers */}
        {offers.length > 0 && (
          <View style={{ marginHorizontal: -16, paddingTop: 6 }}>
            <OfferCarousel offers={offers} onPress={() => {}} />
          </View>
        )}

        {/* Premium Category Bar */}
        <View style={styles.categoryBar}>
          <View style={styles.categoryRowHeader}>
            <Text style={styles.categoryHeading}>Categories</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.sortBtn}
              onPress={() => setSortOpen(true)}
            >
              <Ionicons name="swap-vertical" size={16} color="#0F766E" />
              <Text style={styles.sortText} numberOfLines={1}>
                {SORT_OPTIONS.find((s) => s.value === sort)?.label}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingCategories ? (
            <Text style={{ color: "#64748B", fontWeight: "800" }}>
              Loading categories…
            </Text>
          ) : (
            <FlatList
              ref={(ref) => {
                categoryListRef.current = ref;
              }}
              horizontal
              data={categories}
              keyExtractor={(i) => i.slug}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 10 }}
              getItemLayout={(_, index) => ({
                length: 76,
                offset: 76 * index,
                index,
              })}
              renderItem={({ item, index }) => {
                const active = selectedCategory === item.slug;

                return (
                  <TouchableOpacity
                    activeOpacity={0.92}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => onCategoryChange(item.slug, index)}
                  >
                    <View style={styles.categoryIconWrap}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.categoryIcon} />
                      ) : (
                        <Text
                          style={[
                            styles.categoryIconFallback,
                            active && { color: "#0F766E" },
                          ]}
                        >
                          {item.name?.trim()?.[0]?.toUpperCase() ?? "?"}
                        </Text>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.categoryChipText,
                        active && styles.categoryChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    {/* ✅ bottom underline bar */}
                    <View
                      style={[
                        styles.categoryUnderline,
                        active && styles.categoryUnderlineActive,
                      ]}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </>
    );
  }, [mall?.name, offers, categories, selectedCategory, sort, loadingCategories]);

  /* ================= PRODUCT CARD (small, dense) ================= */

  const renderProductCard = ({ item }: { item: Product }) => {
    const qty = getQtyInCart(item.id);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() =>
            navigation.navigate("MallProductDetails", {
              productId: item.id,
              mallId: mallId,
            })
          }
        >
          <View style={styles.imageWrap}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>{item.name?.[0] || "P"}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{Number(item.price).toFixed(0)}</Text>
            {item.marked_price > item.price ? (
              <Text style={styles.mrp}>₹{Number(item.marked_price).toFixed(0)}</Text>
            ) : null}
          </View>

          {qty > 0 ? (
            <View style={styles.qtyTag}>
              <Ionicons name="cart-outline" size={14} color="#0F766E" />
              <Text style={styles.qtyTagText}>{qty}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  /* ================= RENDER ================= */

  if (!mall) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading mall...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <HomeHeader
          showLocationBar={false}
          showLocationTextBelowLogo
          locationTitle={mall.name}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search products..."
        />

        <FlatList
          data={filteredProducts}
          numColumns={productColumns}
          key={`cols-${productColumns}`}
          keyExtractor={(i) => `product-${i.id}`}
          contentContainerStyle={styles.list}
          columnWrapperStyle={productColumns > 1 ? styles.columnWrap : undefined}
          ListHeaderComponent={headerComponent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={renderProductCard}
          ListEmptyComponent={
            loadingProducts ? (
              <Text style={styles.empty}>Loading products...</Text>
            ) : (
              <Text style={styles.empty}>No products found</Text>
            )
          }
          showsVerticalScrollIndicator={false}
        />

        {/* SORT MODAL */}
        <Modal visible={sortOpen} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setSortOpen(false)}>
            <View style={styles.sortDropdown}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.sortOption}
                  onPress={() => {
                    onSortChange(opt.value);
                    setSortOpen(false);
                  }}
                >
                  <Text style={styles.sortOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },

  mallHero: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  mallTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  list: { padding: 16, paddingBottom: 14 },
  columnWrap: { justifyContent: "space-between" },

  /* Category Bar */
  categoryBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },

  categoryRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  categoryHeading: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },

  categoryChip: {
    width: 72,
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  categoryChipActive: {
    borderColor: "#0F766E",
    backgroundColor: "#ECFEFF",
  },

  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryIcon: { width: "100%", height: "100%", resizeMode: "cover" },

  categoryIconFallback: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  categoryChipText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },

  categoryChipTextActive: {
    color: "#0F766E",
  },

  categoryUnderline: {
    marginTop: 6,
    height: 3,
    width: "80%",
    borderRadius: 999,
    backgroundColor: "transparent",
  },

  categoryUnderlineActive: {
    backgroundColor: "#0F766E",
  },

  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  sortText: { color: "#0F766E", fontWeight: "800", fontSize: 12, maxWidth: 130 },

  /* Small Product Cards */
  card: {
    width: "48%",
    backgroundColor: "#E6F4F1",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  imageWrap: {
    width: "100%",
    height: 92,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },

  name: {
    fontWeight: "800",
    marginTop: 6,
    color: "#0F172A",
    fontSize: 12,
    minHeight: 34,
  },

  priceRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  price: {
    color: "#0F766E",
    fontWeight: "900",
    fontSize: 13,
  },

  mrp: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },

  qtyTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  qtyTagText: {
    fontWeight: "900",
    color: "#0F766E",
    fontSize: 12,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#94A3B8",
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "flex-start",
    paddingTop: 320,
  },
  sortDropdown: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sortOption: { padding: 16 },
  sortOptionText: { fontWeight: "700", color: "#0F172A" },
});
