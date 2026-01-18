import { useEffect, useState } from "react";
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
  Alert,
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
  image?: string | null;
};

type Category = {
  id: number;
  name: string;
  slug: string;
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
  const { addToCart, fetchCart, cart, isGuest } = useCart();

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

    // ✅ refresh cart for this mall (guest/local OR backend)
    fetchCart();
  }, [mall]);

  /* ================= API ================= */

  const fetchMallDetails = async () => {
    const res = await api.get(`malls/${mallId}/`);
    setMall(res.data);
  };

  const fetchCategories = async () => {
    const res = await api.get("products/categories/", {
      params: { mall: mallId },
    });

    setCategories([{ id: -1, name: "All", slug: "__all__" }, ...(res.data || [])]);
  };

  const fetchMallOffers = async () => {
    const res = await api.get("malls/offers/", {
      params: { mall: mallId },
    });
    setOffers(res.data || []);
  };

  const fetchProducts = async (category: string, sortBy: string) => {
    const res = await api.get("products/list/", {
      params: {
        mall: mallId,
        category: category !== "__all__" ? category : undefined,
        sort: sortBy,
      },
    });

    setProducts(res.data || []);
    setFilteredProducts(res.data || []);
  };

  /* ================= USER ACTION HANDLERS ================= */

  const onCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    fetchProducts(slug, sort);
  };

  const onSortChange = (value: string) => {
    setSort(value);
    fetchProducts(selectedCategory, value);
  };

  /* ================= REFRESH ================= */

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(selectedCategory, sort);
    setRefreshing(false);
  };

  /* ================= LOCAL SEARCH ================= */

  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products);
      return;
    }

    const q = search.toLowerCase();
    setFilteredProducts(products.filter((p) => p.name.toLowerCase().includes(q)));
  }, [search, products]);

  /* ================= CART HELPERS ================= */

  const getQtyInCart = (productId: number) => {
    return cart?.items?.find((x) => x.product.id === productId)?.quantity || 0;
  };

  /* ================= HEADER ================= */

  const renderHeader = () => (
    <>
      <View style={styles.mallHero}>
        <Text style={styles.mallTitle}>Welcome to {mall?.name ?? ""}</Text>
        <Text style={styles.mallSub}>{mall?.description}</Text>
        <Text style={styles.mallSub}>{mall?.address}</Text>
      </View>

      {offers.length > 0 && <OfferCarousel offers={offers} onPress={() => {}} />}

      <View style={styles.stickyBar}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(i) => i.slug}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategory === item.slug && styles.chipActive]}
              onPress={() => onCategoryChange(item.slug)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === item.slug && styles.chipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortOpen(true)}>
          <Ionicons name="swap-vertical" size={16} color="#0F766E" />
          <Text style={styles.sortText}>
            {SORT_OPTIONS.find((s) => s.value === sort)?.label}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

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
          numColumns={2}
          keyExtractor={(i) => `product-${i.id}`}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const qty = getQtyInCart(item.id);

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("MallProductDetails", {
                      productId: item.id,
                      mallId: mallId,
                    })
                  }
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} />
                  ) : (
                    <View style={styles.placeholder}>
                      <Text style={styles.placeholderText}>{item.name?.[0] || "P"}</Text>
                    </View>
                  )}

                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <Text style={styles.price}>₹{item.price}</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                  <Text style={styles.addText}>{qty > 0 ? `Add (+${qty})` : "Add"}</Text>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity> */}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
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

  mallHero: { padding: 16 },
  mallTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  mallSub: { fontSize: 13, color: "#64748B", marginTop: 4 },

  guestBanner: {
    marginTop: 12,
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#A5F3FC",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guestText: { color: "#0F766E", fontWeight: "800", fontSize: 12 },

  stickyBar: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#0F766E" },
  chipText: { fontWeight: "700", color: "#0F172A" },
  chipTextActive: { color: "#fff" },

  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  sortText: { color: "#0F766E", fontWeight: "800" },

  list: { padding: 16, paddingBottom: 140 },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  image: { width: "100%", height: 110, borderRadius: 14 },

  placeholder: {
    height: 110,
    borderRadius: 14,
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { fontSize: 32, fontWeight: "900", color: "#0F172A" },

  name: { fontWeight: "800", marginTop: 8, color: "#0F172A", minHeight: 38 },
  price: { color: "#0F766E", fontWeight: "900", marginTop: 4 },

  addBtn: {
    marginTop: 10,
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  addText: { color: "#fff", fontWeight: "900" },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#94A3B8",
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
