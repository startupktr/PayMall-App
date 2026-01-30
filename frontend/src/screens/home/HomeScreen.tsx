import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from "react-native";
import * as Location from "expo-location";
import api from "@/api/axios";
import HomeHeader from "@/components/HomeHeader";
import OfferCarousel from "@/components/OfferCarousel";
import MallCard from "@/components/MallCard";
import { GlobalOffer } from "@/types/offer";
import { useFocusEffect } from "@react-navigation/native";
import { useMall } from "@/context/MallContext";

/* ================= TYPES ================= */

type Mall = {
  id: string;
  name: string;
  address: string;
  image: string;
  description: string;
  distance: number;
};

/* ================= HELPERS ================= */

const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage = "Request timed out"
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* ================= SHIMMER SKELETON ================= */

function ShimmerMallGrid({ isDark }: { isDark: boolean }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  // ✅ match your card themes
  const base = isDark ? "#0F172A" : "#E6F4F1"; // same as your MallCard bg tone
  const block = isDark ? "#111827" : "#CBD5E1";
  const highlight = isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.55)";

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 260],
  });

  const SkeletonCard = () => (
    <View style={[styles.mallSkeletonCard, { backgroundColor: base }]}>
      {/* image */}
      <View style={[styles.mallSkeletonImage, { backgroundColor: block }]} />

      {/* text lines */}
      <View style={[styles.mallSkeletonTitle, { backgroundColor: block }]} />
      <View style={[styles.mallSkeletonTagline, { backgroundColor: block }]} />

      {/* distance */}
      <View style={[styles.mallSkeletonDistance, { backgroundColor: block }]} />

      {/* shimmer overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.mallSkeletonShimmerOverlay,
          {
            transform: [{ translateX }],
            backgroundColor: highlight,
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.grid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

/* ================= SCREEN ================= */

export default function HomeScreen({ navigation }: any) {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [filteredMalls, setFilteredMalls] = useState<Mall[]>([]);
  const [offers, setOffers] = useState<GlobalOffer[]>([]);

  const [loading, setLoading] = useState(true);
  const [mallsLoading, setMallsLoading] = useState(true); // ✅ skeleton toggle
  const [refreshing, setRefreshing] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showAllMalls, setShowAllMalls] = useState(false);
  const [search, setSearch] = useState("");
  const { setSelectedMall } = useMall();
  const [formatted, setFormatted] = useState<string | null>(null);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // keyboard state (not used but keeping same)
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const lastFetchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const MIN_DISTANCE_TO_REFETCH_METERS = 200;

  const fetchingLocationRef = useRef(false);
  const showMallSkeleton = !hasLoadedOnce && (mallsLoading || malls.length === 0);

  /* ================= KEYBOARD LISTENER ================= */

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardOpen(true)
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardOpen(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ================= INITIAL LOAD ================= */

  useFocusEffect(
    useCallback(() => {
      setSelectedMall(null);
    }, [setSelectedMall])
  );

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    fetchMallOffers();
    await ensureLocationAndFetch();
  };

  /* ================= API ================= */

  const fetchNearbyMalls = async (lat: number, lng: number) => {
    try {
      setMallsLoading(true);

      const res = await api.get(`malls/nearby/?latitude=${lat}&longitude=${lng}`);

      setMalls(res.data);
      setFilteredMalls(res.data);

      setHasLoadedOnce(true);
    } catch (error) {
      console.log("Mall API error:", error);
      Alert.alert("Error", "Unable to fetch nearby malls");
    } finally {
      setMallsLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMallOffers = async () => {
    try {
      const res = await api.get("malls/offers/");
      setOffers(res.data);
    } catch (error) {
      console.log("Offer API error", error);
    }
  };

  /* ================= LOCATION FLOW ================= */

  const ensureLocationAndFetch = async () => {
    if (fetchingLocationRef.current) return;
    fetchingLocationRef.current = true;

    try {
      if (!hasLoadedOnce) setLoading(true);
      setRefreshing(true);
      setLocationDenied(false);

      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== "granted") {
          setLocationDenied(true);
          setLoading(false);
          setRefreshing(false);
          setMallsLoading(false);
          return;
        }
      }

      await fetchLocationAndMallsSmart();
    } catch (err) {
      console.log("Location init error:", err);
      setLoading(false);
      setRefreshing(false);
      setMallsLoading(false);
    } finally {
      fetchingLocationRef.current = false;
    }
  };

  const maybeFetchNearbyMalls = (lat: number, lng: number) => {
    const last = lastFetchedCoordsRef.current;

    if (!last) {
      lastFetchedCoordsRef.current = { lat, lng };
      fetchNearbyMalls(lat, lng);
      return;
    }

    const movedMeters = haversineMeters(last.lat, last.lng, lat, lng);

    if (movedMeters >= MIN_DISTANCE_TO_REFETCH_METERS) {
      lastFetchedCoordsRef.current = { lat, lng };
      fetchNearbyMalls(lat, lng);
    } else {
      setLoading(false);
      setRefreshing(false);

      if (hasLoadedOnce) setMallsLoading(false);
    }
  };

  const reverseGeocodeInBackground = async (lat: number, lng: number) => {
    try {
      const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const place = res?.[0] ?? null;

      const city =
        place?.city || (place as any)?.subregion || place?.district || place?.region || "";

      const state = place?.region || "";
      const country = place?.country || "";

      setFormatted([city, state, country].filter(Boolean).join(", "));
    } catch (err) {
      console.log("Reverse geocode failed:", err);
    }
  };

  const fetchLocationAndMallsSmart = async () => {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();

      if (lastKnown?.coords?.latitude && lastKnown?.coords?.longitude) {
        const lat = lastKnown.coords.latitude;
        const lng = lastKnown.coords.longitude;

        maybeFetchNearbyMalls(lat, lng);
        reverseGeocodeInBackground(lat, lng);
      }

      const current = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        }),
        15000,
        "Location timeout"
      );

      const lat = current.coords.latitude;
      const lng = current.coords.longitude;

      maybeFetchNearbyMalls(lat, lng);
      reverseGeocodeInBackground(lat, lng);
    } catch (err: any) {
      console.log("Location fetch error:", err?.message || err);
      setLoading(false);
      setRefreshing(false);
      setMallsLoading(false);
    }
  };

  /* ================= LOCAL SEARCH ================= */

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMalls(malls);
      return;
    }

    const q = search.toLowerCase();
    setFilteredMalls(malls.filter((m) => m.name.toLowerCase().includes(q)));
  }, [search, malls]);

  /* ================= LOADING STATES ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Finding nearby malls...</Text>
      </View>
    );
  }

  if (locationDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Location Permission Denied</Text>
        <Text style={styles.errorText}>Enable location to discover nearby malls</Text>

        <TouchableOpacity style={styles.retryBtn} onPress={ensureLocationAndFetch}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= RENDER ================= */

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? "#0B1220" : "#F1F5F9" }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <HomeHeader
          showLocationBar={false}
          showLocationTextBelowLogo
          searchValue={search}
          onSearchChange={setSearch}
          locationTitle={formatted || ""}
          searchPlaceholder="Search nearby malls..."
        />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={ensureLocationAndFetch} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {offers.length > 0 && (
            <View style={{ marginHorizontal: -16, paddingTop: 10 }}>
              <OfferCarousel
                offers={offers}
                onPress={(mallId) => navigation.navigate("MallDetails", { mallId })}
              />
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: isDark ? "#F8FAFC" : "#020617" }]}>
            Malls Nearby
          </Text>

          {/* ✅ Shimmer skeleton */}
          {showMallSkeleton ? (
            <ShimmerMallGrid isDark={isDark} />
          ) : (
            <>
              <View style={styles.grid}>
                {filteredMalls
                  .slice(0, showAllMalls ? filteredMalls.length : 4)
                  .map((mall) => (
                    <View key={mall.id} style={styles.gridItem}>
                      <MallCard
                        name={mall.name}
                        image={mall.image}
                        tagline={mall.description}
                        distance={mall.distance}
                        onPress={() => navigation.navigate("MallDetails", { mallId: mall.id })}
                      />
                    </View>
                  ))}
              </View>

              {filteredMalls.length > 4 && (
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowAllMalls((p) => !p)}>
                  <Text style={styles.viewAllText}>{showAllMalls ? "Show Less" : "View All"}</Text>
                </TouchableOpacity>
              )}

              {filteredMalls.length === 0 && <Text style={styles.empty}>No malls found</Text>}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { paddingHorizontal: 16 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: { marginTop: 12, color: "#475569" },

  errorTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  errorText: { textAlign: "center", color: "#64748B", marginBottom: 20 },

  retryBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#020617",
    marginTop: 10,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: { width: "48%" },

  viewAllBtn: { marginTop: 10, alignSelf: "center" },
  viewAllText: { fontSize: 14, color: "#2563EB", fontWeight: "700" },

  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#94A3B8",
  },

  /* ✅ shimmer skeleton card */
  skelCard: {
    width: "100%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  skelImage: {
    width: "100%",
    height: 110,
    borderRadius: 14,
  },
  skelLineLg: {
    height: 12,
    borderRadius: 6,
    marginTop: 12,
    width: "90%",
  },
  skelLineSm: {
    height: 10,
    borderRadius: 6,
    marginTop: 8,
    width: "60%",
  },

  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: 80,
    opacity: 0.8,
    borderRadius: 16,
  },
    /* ✅ MallCard matched skeleton */
  mallSkeletonCard: {
    width: "100%",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  mallSkeletonImage: {
    width: "100%",
    height: 110,
    borderRadius: 14,
  },

  mallSkeletonTitle: {
    height: 14,
    borderRadius: 7,
    marginTop: 10,
    width: "90%",
  },

  mallSkeletonTagline: {
    height: 11,
    borderRadius: 7,
    marginTop: 8,
    width: "70%",
  },

  mallSkeletonDistance: {
    height: 12,
    borderRadius: 7,
    marginTop: 10,
    width: "45%",
  },

  mallSkeletonShimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: 90,
    opacity: 0.85,
    borderRadius: 18,
  },

});
