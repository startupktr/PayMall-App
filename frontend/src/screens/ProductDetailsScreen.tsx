import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

export default function ProductDetailsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { product } = route.params;
    const { addToCart } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    const handleAddToCart = async () => {
        await addToCart(product.id, quantity);

        Alert.alert("Added to Cart", "Product added successfully", [
            { text: "Continue Shopping", onPress: () => navigation.goBack() },
            { text: "Go to Cart", onPress: () => navigation.navigate("Cart") },
        ]);
    };


    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* IMAGE */}
                {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>
                            {product.name[0]}
                        </Text>
                    </View>
                )}

                {/* INFO */}
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>₹{product.price}</Text>

                <Text style={styles.description}>
                    {product.description || "No description available"}
                </Text>

                {/* QUANTITY */}
                <View style={styles.qtyRow}>
                    <Text style={styles.qtyLabel}>Quantity</Text>
                    <View style={styles.qtyControls}>
                        <TouchableOpacity
                            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                            <Ionicons name="remove-circle-outline" size={28} />
                        </TouchableOpacity>

                        <Text style={styles.qtyValue}>{quantity}</Text>

                        <TouchableOpacity
                            onPress={() => setQuantity((q) => q + 1)}
                        >
                            <Ionicons name="add-circle-outline" size={28} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* ADD TO CART */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.addBtn}
                    disabled={adding}
                    onPress={handleAddToCart}
                >
                    <Text style={styles.addBtnText}>
                        {adding ? "Adding..." : "Add to Cart"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "700",
    },

    content: {
        padding: 16,
        paddingBottom: 120,
    },

    image: {
        width: "100%",
        height: 240,
        borderRadius: 16,
        marginBottom: 16,
    },
    imagePlaceholder: {
        width: "100%",
        height: 240,
        borderRadius: 16,
        backgroundColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    imagePlaceholderText: {
        fontSize: 48,
        fontWeight: "700",
        color: "#2563EB",
    },

    name: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        color: "#16A34A",
        fontWeight: "700",
        marginBottom: 12,
    },

    description: {
        color: "#475569",
        marginBottom: 20,
    },

    qtyRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    qtyLabel: {
        fontWeight: "600",
    },
    qtyControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    qtyValue: {
        fontSize: 16,
        fontWeight: "700",
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        backgroundColor: "#fff",
    },
    addBtn: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    addBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});
