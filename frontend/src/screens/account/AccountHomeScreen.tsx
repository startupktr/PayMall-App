import React, { useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function AccountHomeScreen() {
    const navigation: any = useNavigation();
    const { logout } = useAuth();
    const user = {
        name: "Chandan Roy",
        phoneMasked: "+91 ••••• 3210",
        unreadNotifications: 3,
        profileImage: "https://i.pravatar.cc/150?img=12",
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

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerCard}>
                    <View style={styles.headerRow}>
                        {/* Profile Image */}
                        <TouchableOpacity
                            style={styles.avatarWrap}
                            onPress={() => navigation.navigate("Profile")}
                            activeOpacity={0.85}
                        >
                            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                        </TouchableOpacity>

                        {/* User Info */}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.welcome}>Account</Text>

                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{user.name}</Text>
                            </View>

                            <Text style={styles.sub}>{user.phoneMasked}</Text>
                        </View>

                        {/* Notification Button */}
                        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.85}>
                            <Ionicons name="notifications-outline" size={22} color="#2FA4A9" />
                            {user.unreadNotifications > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {user.unreadNotifications > 9 ? "9+" : user.unreadNotifications}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Manage</Text>

                {/* Grid of Actions */}
                <View style={styles.grid}>
                    <AccountTile
                        icon="card-outline"
                        title="Payment Methods"
                        subtitle="Cards, UPI, Default"
                        onPress={() => navigation.navigate("PaymentMethod")}
                    />

                    <AccountTile
                        icon="pricetag-outline"
                        title="Offers & Coupons"
                        subtitle="Active & Expired"
                        onPress={() => navigation.navigate("Coupons")}
                    />

                    <AccountTile
                        icon="help-circle-outline"
                        title="Support & Help"
                        subtitle="Chat, Tickets, FAQs"
                        onPress={() => navigation.navigate("Support")}
                    />

                    <AccountTile
                        icon="shield-checkmark-outline"
                        title="Privacy Settings"
                        subtitle="Consent & Data"
                        onPress={() => navigation.navigate("Privacy")}
                    />

                    <AccountTile
                        icon="settings-outline"
                        title="App Settings"
                        subtitle="Theme, Language"
                        onPress={() => navigation.navigate("Setting")}
                    />

                    <AccountTile
                        icon="gift-outline"
                        title="Referrals & Invites"
                        subtitle="Earn rewards"
                        onPress={() => navigation.navigate("Referral")}
                    />
                </View>

                {/* Bottom Actions */}
                <View style={styles.bottomCard}>
                    <TouchableOpacity
                        style={styles.bottomRow}
                        onPress={() => navigation.navigate("Profile")}
                        activeOpacity={0.85}
                    >
                        <View style={styles.bottomLeft}>
                            <Ionicons name="person-circle-outline" size={22} color="#2FA4A9" />
                            <Text style={styles.bottomText}>Go to Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#888" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.bottomRow} onPress={Onlogout} activeOpacity={0.85}>
                        <View style={styles.bottomLeft}>
                            <Ionicons name="log-out-outline" size={22} color="#E05A5A" />
                            <Text style={[styles.bottomText, { color: "#E05A5A" }]}>Logout</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#888" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------- Animated Tile Component ---------- */

function AccountTile({ icon, title, subtitle, onPress }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
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
            <Animated.View style={[styles.tile, { transform: [{ scale }] }]}>
                <View style={styles.tileIconWrap}>
                    <Ionicons name={icon} size={22} color="#2FA4A9" />
                </View>
                <Text style={styles.tileTitle}>{title}</Text>
                <Text style={styles.tileSubtitle}>{subtitle}</Text>
            </Animated.View>
        </Pressable>
    );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#EEF7F5",
    },

    container: {
        flex: 1,
        backgroundColor: "#EEF7F5",
        paddingHorizontal: 16,
    },

    headerCard: {
        marginTop: 12,
        backgroundColor: "#fff",
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
        backgroundColor: "#F6F8FA",
    },

    avatar: {
        width: "100%",
        height: "100%",
    },

    welcome: {
        fontSize: 14,
        color: "#666",
    },

    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 2,
    },

    name: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },

    viewProfileBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F6F8FA",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },

    viewProfileText: {
        color: "#2FA4A9",
        fontWeight: "700",
        fontSize: 12,
    },

    sub: {
        fontSize: 13,
        color: "#888",
        marginTop: 6,
    },

    notifBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: "#F6F8FA",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },

    badge: {
        position: "absolute",
        top: 6,
        right: 6,
        backgroundColor: "#E05A5A",
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
        fontWeight: "700",
        color: "#333",
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    tile: {
        width: 165, // keeps consistent width animation
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
    },

    tileIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: "#F6F8FA",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },

    tileTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111",
    },

    tileSubtitle: {
        fontSize: 12,
        color: "#777",
        marginTop: 3,
        lineHeight: 16,
    },

    bottomCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        paddingVertical: 6,
        marginTop: 8,
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
        fontWeight: "600",
        color: "#111",
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginHorizontal: 14,
    },
});
