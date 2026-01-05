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

export default function HomeHeader() {
    return (
        <SafeAreaView edges={["top"]} style={styles.safe}>
            <View style={styles.container}>
                {/* 🔝 Top Bar */}
                <View style={styles.topRow}>
                    <Text style={styles.logo}>PayMall</Text>

                    <View style={styles.topIcons}>
                        <TouchableOpacity>
                            <Ionicons
                                name="notifications-outline"
                                size={28}
                                color="#334155"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity>
                            <Image
                                source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 📍 Location */}
                <TouchableOpacity style={styles.locationCard}>
                    <Ionicons name="location-outline" size={18} color="#0F766E" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Bangalore</Text>
                        <Text style={styles.locationSub}>
                            BTM Layout, 560068
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* 🔍 Search */}
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color="#64748B" />
                    <TextInput
                        placeholder="Search anything..."
                        placeholderTextColor="#64748B"
                        style={styles.searchInput}
                    />
                    <Ionicons name="mic-outline" size={18} color="#0F766E" />
                </View>
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
        backgroundColor: "#e0f3efff"
    },

    /* Top Bar */
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    logo: {
        fontSize: 22,
        fontWeight: "800",
        color: "#F97316",
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

    /* Location */
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
