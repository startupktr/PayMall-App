import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import api from "../api/axios";
import HomeHeader from "../components/HomeHeader";
import OfferCarousel from "../components/OfferCarousel";
import MallCard from "../components/MallCard";
import { GlobalOffer } from "../types/offer";

/* ================= TYPES ================= */

type Mall = {
  id: number;
  name: string;
  address: string;
  image: string;
  description: string;
  distance: number;
};

/* ================= SCREEN ================= */

export default function HomeScreen({ navigation }: any) {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [filteredMalls, setFilteredMalls] = useState<Mall[]>([]);
  const [offers, setOffers] = useState<GlobalOffer[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showAllMalls, setShowAllMalls] = useState(false);
  const [search, setSearch] = useState("");

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await ensureLocationAndFetch();
    fetchMallOffers();
  };

  /* ================= LOCATION FLOW ================= */

  const ensureLocationAndFetch = async () => {
    try {
      setLoading(true);
      setLocationDenied(false);

      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== "granted") {
          setLocationDenied(true);
          setLoading(false);
          return;
        }
      }

      await fetchLocationAndMalls();
    } catch (err) {
      console.log("Location init error:", err);
      setLoading(false);
    }
  };

  const fetchLocationAndMalls = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      await fetchNearbyMalls(latitude, longitude);
    } catch (err) {
      console.log("Location fetch error:", err);
      setLoading(false);
    }
  };

  /* ================= API ================= */

  const fetchNearbyMalls = async (lat: number, lng: number) => {
    try {
      setRefreshing(true);

      const res = await api.post("malls/nearby/", {
        latitude: lat,
        longitude: lng,
      });

      setMalls(res.data);
      setFilteredMalls(res.data);
    } catch (error) {
      console.log("Mall API error:", error);
      Alert.alert("Error", "Unable to fetch nearby malls");
    } finally {
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

  /* ================= LOCAL SEARCH ================= */

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMalls(malls);
      return;
    }

    const q = search.toLowerCase();
    setFilteredMalls(
      malls.filter((m) => m.name.toLowerCase().includes(q))
    );
  }, [search, malls]);

  /* ================= LOADING STATES ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Finding nearby malls...
        </Text>
      </View>
    );
  }

  if (locationDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Location Permission Denied
        </Text>
        <Text style={styles.errorText}>
          Enable location to discover nearby malls
        </Text>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={ensureLocationAndFetch}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= RENDER ================= */

  return (
    <View style={styles.container}>
      <HomeHeader
        showLocationBar={false}
        showLocationTextBelowLogo
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search nearby malls..."
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={ensureLocationAndFetch}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {offers.length > 0 && (
          <OfferCarousel
            offers={offers}
            onPress={(mallId) =>
              navigation.navigate("MallDetailsScreen", { mallId })
            }
          />
        )}

        <Text style={styles.sectionTitle}>Malls Nearby</Text>

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
                  onPress={() =>
                    navigation.navigate("MallDetails", {
                      mallId: mall.id,
                    })
                  }
                />
              </View>
            ))}
        </View>

        {filteredMalls.length > 4 && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => setShowAllMalls((p) => !p)}
          >
            <Text style={styles.viewAllText}>
              {showAllMalls ? "Show Less" : "View All"}
            </Text>
          </TouchableOpacity>
        )}

        {filteredMalls.length === 0 && (
          <Text style={styles.empty}>No malls found</Text>
        )}
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { paddingHorizontal: 16, paddingBottom: 30 },

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
    marginTop: 40,
    color: "#94A3B8",
  },
});
