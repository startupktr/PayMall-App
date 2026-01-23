import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

type HomeHeaderProps = {
  showLocationBar?: boolean;
  showLocationTextBelowLogo?: boolean;
  locationTitle?: string;

  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
};

export default function HomeHeader({
  showLocationBar = true,
  showLocationTextBelowLogo = false,
  locationTitle = "",

  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search",
  showSearch = true,
}: HomeHeaderProps) {
  const navigation = useNavigation<any>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // ✅ Same design colors, but theme-aware
  const colors = {
    safeBg: isDark ? "#0B1220" : "#E6F4F1",
    headerBg: isDark ? "#0F172A" : "#e0f3efff",
    logo: "#F97316",
    teal: "#0F766E",

    textPrimary: isDark ? "#F8FAFC" : "#020617",
    textMuted: isDark ? "#94A3B8" : "#64748B",
    icon: isDark ? "#CBD5E1" : "#334155",

    card: isDark ? "#111827" : "#FFFFFF",
    input: isDark ? "#0B1220" : "#F8FAFC",
    border: isDark ? "#1F2937" : "#CBD5E1",
    chevron: isDark ? "#94A3B8" : "#94A3B8",
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: colors.safeBg }]}>
      {/* ✅ Fix status bar icons visibility on real phone */}
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.safeBg} // Android
        translucent={false}
      />

      <View style={[styles.container, { backgroundColor: colors.headerBg }]}>
        {/* 🔝 Top Bar */}
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.logo, { color: colors.logo }]}>PayMall</Text>

            {showLocationTextBelowLogo && (
              <View style={styles.inlineLocation}>
                <Ionicons name="location-outline" size={14} color={colors.teal} />
                <Text style={[styles.inlineLocationText, { color: colors.teal }]}>
                  {locationTitle}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.topIcons}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={28} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AccountTab", {
                  screen: "Profile",
                })
              }
            >
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                style={[styles.avatar, { borderColor: colors.border }]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 📍 Full Location Card */}
        {showLocationBar && (
          <TouchableOpacity style={[styles.locationCard, { backgroundColor: colors.card }]}>
            <Ionicons name="location-outline" size={18} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
                {locationTitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </TouchableOpacity>
        )}

        {/* 🔍 Search */}
        {showSearch && (
          <View style={[styles.searchBox, { backgroundColor: colors.input }]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />

            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={searchValue}
              editable={!!onSearchChange}
              onChangeText={onSearchChange}
              returnKeyType="search"
              onSubmitEditing={onSearchSubmit}
            />

            {/* ❌ Clear button */}
            {searchValue.length > 0 ? (
              <TouchableOpacity onPress={() => onSearchChange?.("")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              // ✅ mic stays same, just clickable
              <TouchableOpacity activeOpacity={0.7}>
                <Ionicons name="mic-outline" size={18} color={colors.teal} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    // bg handled dynamically
  },
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
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
  },

  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  inlineLocationText: {
    fontSize: 12,
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
  },

  /* Location Card */
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  },

  /* Search */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 55,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
  },
});
