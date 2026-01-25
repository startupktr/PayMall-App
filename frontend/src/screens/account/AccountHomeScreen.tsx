import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Pressable,
  Animated,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function AccountHomeScreen() {
  const navigation: any = useNavigation();
  const { user, logout, loading } = useAuth();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { width } = useWindowDimensions();

  // ✅ layout constants
  const H_PADDING = 16;
  const GAP = 12;

  // ✅ responsive columns (2 on phones, 3 on tablets)
  const columns = useMemo(() => {
    if (width >= 768) return 3; // tablet breakpoint
    return 2;
  }, [width]);

  const tileWidth = useMemo(() => {
    const totalGaps = GAP * (columns - 1);
    const available = width - H_PADDING * 2 - totalGaps;
    return Math.floor(available / columns);
  }, [width, columns]);

  const colors = {
    bg: isDark ? "#0B1220" : "#EEF7F5",
    card: isDark ? "#0F172A" : "#FFFFFF",
    softCard: isDark ? "#111827" : "#F6F8FA",
    border: isDark ? "#1F2937" : "#E2E8F0",

    textPrimary: isDark ? "#F8FAFC" : "#111111",
    textMuted: isDark ? "#94A3B8" : "#666666",
    subText: isDark ? "#94A3B8" : "#888888",

    accent: "#2FA4A9",
    danger: "#E05A5A",
    divider: isDark ? "#1F2937" : "#F0F0F0",
  };

  const User = {
    name: user?.full_name ?? "",
    phoneMasked: user?.phone_number
      ? `+91 ••••• ${user.phone_number.slice(-4)}`
      : "",
    unreadNotifications: 3,
    profileImage: user?.avatar,
  };

  const Onlogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  // ✅ Skeleton state: show until auth resolved
  const showSkeleton = loading || !user;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={["top"]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.headerRow}>
            {/* Avatar */}
            <TouchableOpacity
              style={[styles.avatarWrap, { backgroundColor: colors.softCard }]}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.85}
              disabled={showSkeleton}
            >
              {showSkeleton ? (
                <View style={[styles.skeletonBox, { borderRadius: 28 }]} />
              ) : User.profileImage ? (
                <Image source={{ uri: User.profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.border }]}>
                  <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
                    {User.name?.[0]?.toUpperCase() ?? "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.welcome, { color: colors.textMuted }]}>Account</Text>

              {showSkeleton ? (
                <>
                  <View style={[styles.skeletonLine, { width: 140, marginTop: 6 }]} />
                  <View style={[styles.skeletonLine, { width: 120, marginTop: 8 }]} />
                </>
              ) : (
                <>
                  <Text
                    style={[styles.name, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {User.name}
                  </Text>

                  <Text style={[styles.sub, { color: colors.subText }]}>{User.phoneMasked}</Text>
                </>
              )}
            </View>

            {/* Notifications */}
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.softCard }]}
              activeOpacity={0.85}
              disabled={showSkeleton}
            >
              {showSkeleton ? (
                <View style={[styles.skeletonBox, { width: 22, height: 22, borderRadius: 6 }]} />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={22} color={colors.accent} />
                  {User.unreadNotifications > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                      <Text style={styles.badgeText}>
                        {User.unreadNotifications > 9 ? "9+" : User.unreadNotifications}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section title */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Manage</Text>

        {/* Grid */}
        <View style={[styles.grid, { columnGap: GAP, rowGap: GAP }]}>
          {(showSkeleton ? Array.from({ length: 6 }) : MANAGE_TILES).map((tile: any, idx: number) => {
            if (showSkeleton) {
              return (
                <View
                  key={`sk-${idx}`}
                  style={[
                    styles.tile,
                    {
                      width: tileWidth,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <View style={[styles.skeletonBox, { width: 42, height: 42, borderRadius: 14 }]} />
                  <View style={[styles.skeletonLine, { width: "70%", marginTop: 12 }]} />
                  <View style={[styles.skeletonLine, { width: "95%", marginTop: 8 }]} />
                </View>
              );
            }

            return (
              <AccountTile
                key={tile.title}
                colors={colors}
                width={tileWidth}
                icon={tile.icon}
                title={tile.title}
                subtitle={tile.subtitle}
                onPress={() => navigation.navigate(tile.screen)}
              />
            );
          })}
        </View>

        {/* Bottom actions */}
        <View style={[styles.bottomCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.bottomRow}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.85}
            disabled={showSkeleton}
          >
            <View style={styles.bottomLeft}>
              <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
              <Text style={[styles.bottomText, { color: colors.textPrimary }]}>Go to Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity
            style={styles.bottomRow}
            onPress={Onlogout}
            activeOpacity={0.85}
            disabled={showSkeleton}
          >
            <View style={styles.bottomLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.danger} />
              <Text style={[styles.bottomText, { color: colors.danger }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ✅ Manage tiles list (production style) */
const MANAGE_TILES = [
  {
    icon: "card-outline",
    title: "Payment Methods",
    subtitle: "Cards, UPI, Default",
    screen: "PaymentMethod",
  },
  {
    icon: "pricetag-outline",
    title: "Offers & Coupons",
    subtitle: "Active & Expired",
    screen: "Coupons",
  },
  {
    icon: "help-circle-outline",
    title: "Support & Help",
    subtitle: "Chat, Tickets, FAQs",
    screen: "Support",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Privacy Settings",
    subtitle: "Consent & Data",
    screen: "Privacy",
  },
  {
    icon: "settings-outline",
    title: "App Settings",
    subtitle: "Theme, Language",
    screen: "Setting",
  },
  {
    icon: "gift-outline",
    title: "Referrals & Invites",
    subtitle: "Earn rewards",
    screen: "Referral",
  },
];

/* ---------- Animated Tile Component ---------- */

function AccountTile({ icon, title, subtitle, onPress, width, colors }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 35,
      bounciness: 8,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.tile,
          {
            width,
            backgroundColor: colors.card,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={[styles.tileIconWrap, { backgroundColor: colors.softCard }]}>
          <Ionicons name={icon} size={22} color={colors.accent} />
        </View>

        <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>

        <Text style={[styles.tileSubtitle, { color: colors.subText }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  container: { flex: 1, paddingHorizontal: 16 },

  headerCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },

  welcome: { fontSize: 14 },

  name: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  sub: {
    fontSize: 13,
    marginTop: 6,
  },

  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "800",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  tile: {
    borderRadius: 18,
    padding: 14,
  },

  tileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  tileTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  tileSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },

  bottomCard: {
    borderRadius: 18,
    paddingVertical: 6,
    marginTop: 12,
  },

  bottomRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bottomLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bottomText: {
    fontSize: 14,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    marginHorizontal: 14,
  },

  /* ✅ skeleton */
  skeletonBox: {
    backgroundColor: "#CBD5E1",
    opacity: 0.35,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
    opacity: 0.35,
  },
});
