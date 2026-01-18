import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";

type HomeHeaderProps = {
  showLocationBar?: boolean;
  showLocationTextBelowLogo?: boolean;
  locationTitle?: string;

  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean; // 👈 NEW (optional)
};

export default function HomeHeader({
  showLocationBar = true,
  showLocationTextBelowLogo = false,
  locationTitle = "Bangalore",

  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search",
  showSearch = true,
}: HomeHeaderProps) {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    await logout();

    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.container}>
        {/* 🔝 Top Bar */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.logo}>PayMall</Text>

            {showLocationTextBelowLogo && (
              <View style={styles.inlineLocation}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#0F766E"
                />
                <Text style={styles.inlineLocationText}>
                  {locationTitle}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.topIcons}>
            <TouchableOpacity>
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#334155"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() =>
              navigation.navigate("AccountTab", {
                screen: "Profile",
              })
            }>
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 📍 Full Location Card */}
        {showLocationBar && (
          <TouchableOpacity style={styles.locationCard}>
            <Ionicons
              name="location-outline"
              size={18}
              color="#0F766E"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>
                {locationTitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}

        {/* 🔍 Search */}
        {showSearch && (
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#64748B"
            />

            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              value={searchValue}
              editable={!!onSearchChange}
              onChangeText={onSearchChange}
              returnKeyType="search"
              onSubmitEditing={onSearchSubmit}
            />

            {/* ❌ Clear button */}
            {searchValue.length > 0 ? (
              <TouchableOpacity
                onPress={() => onSearchChange?.("")}
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
        )}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#E6F4F1",
  },
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#e0f3efff",
  },

  /* Top Bar */
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F97316",
  },

  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  inlineLocationText: {
    fontSize: 12,
    color: "#0F766E",
    fontWeight: "600",
  },

  topIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  /* Location Card */
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#020617",
  },
  locationSub: {
    fontSize: 12,
    color: "#64748B",
  },

  /* Search */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 55,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: "#020617",
  },
});
