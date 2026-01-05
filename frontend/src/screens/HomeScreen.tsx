import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView
} from "react-native";
import * as Location from "expo-location";
import api from "../api/axios";
import HomeHeader from "../components/HomeHeader";
import OfferCarousel from "../components/OfferCarousel";
import MallCard from "../components/MallCard";


type MallOffer = {
  id: number;
  title: string;
  description: string;
  image: string;
  mall_id: number;
  mall_name: string;
};

type Mall = {
  id: number;
  name: string;
  address: string;
  image: string;
  description: string,
  distance: number;
};

export default function HomeScreen({ navigation }: any) {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showAllMalls, setShowAllMalls] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  // 📍 Ask for permission
  const requestLocation = async () => {
    try {
      setLoading(true);              // 🔁 reset loader
      setLocationDenied(false);      // 🔁 reset denied state

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationDenied(true);
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      await fetchNearbyMalls(latitude, longitude);
    } catch (error) {
      console.log("Location error:", error);
      setLoading(false);
    }
  };

  const [offers, setOffers] = useState<MallOffer[]>([]);

  const fetchMallOffers = async () => {
    try {
      const res = await api.get("malls/offers/");
      setOffers(res.data);
    } catch (error) {
      console.log("Offer API error", error);
    }
  };

  useEffect(() => {
    fetchMallOffers();
  }, []);


  // 🌐 API call
  const fetchNearbyMalls = async (lat: number, lng: number) => {
    try {
      const res = await api.post("malls/nearby/", {
        latitude: lat,
        longitude: lng
      });
      setMalls(res.data);
    } catch (error) {
      console.log("API error:", error);
      Alert.alert("Error", "Unable to fetch nearby malls");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Loader
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Finding nearby malls...</Text>
      </View>
    );
  }

  // 🚫 Permission denied UI
  if (locationDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Location Permission Denied</Text>
        <Text style={styles.errorText}>
          Enable location to discover nearby malls
        </Text>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={requestLocation}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header (NO flex:1) */}
      <HomeHeader />

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {offers.length > 0 && (
          <OfferCarousel
            offers={offers}
            onPress={(mallId) =>
              navigation.navigate("MallDetails", { mallId })
            }
          />
        )}

        {/* 🏬 Malls Nearby */}
        <Text style={styles.sectionTitle}>Malls Nearby</Text>
        <View style={styles.grid}>
          {malls
            .slice(0, showAllMalls ? malls.length : 4)
            .map((mall) => (
              <View key={mall.id} style={styles.gridItem}>
                <MallCard
                  name={mall.name}
                  image={mall.image}
                  tagline={mall.description}
                  distance={mall.distance}
                  onPress={() =>
                    navigation.navigate("MallDetails", { mallId: mall.id })
                  }
                />
              </View>
            ))}
        </View>

        {/* 👇 View All only if more than 2 rows */}
        {malls.length > 4 && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => setShowAllMalls(!showAllMalls)}
          >
            <Text style={styles.viewAllText}>{showAllMalls ? "Show Less" : "View All"}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginBottom: 12,
  },
  mallName: {
    fontSize: 18,
    fontWeight: "600",
  },
  mallAddress: {
    marginTop: 4,
    color: "#64748B",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorText: {
    textAlign: "center",
    color: "#64748B",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  viewAll: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
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

  gridItem: {
    width: "48%", // 2 per row
  },

  viewAllBtn: {
    marginTop: 10,
    alignSelf: "center",
  },

  viewAllText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "700",
  },


});
