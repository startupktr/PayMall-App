import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  Vibration,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useMall } from "../context/MallContext";
import { useCart } from "../context/CartContext";
import api from "../api/axios";

/* ======================================================
   SCREEN
====================================================== */

export default function ScannerScreen() {
  const navigation = useNavigation<any>();
  const { selectedMall } = useMall();
  const { addToCart } = useCart();

  /* ================= CAMERA PERMISSION ================= */
  const [permission, requestPermission] = useCameraPermissions();

  /* ================= STATES ================= */
  const [cameraActive, setCameraActive] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [manualOpen, setManualOpen] = useState(false);
  const [barcode, setBarcode] = useState("");

  const [scanned, setScanned] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);

  /* ================= SCAN LINE ================= */
  const scanAnim = useRef(new Animated.Value(0)).current;

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /* ================= RESET ================= */
  const resetScannerUI = () => {
    setPreviewProduct(null);
    setManualOpen(false);
    setBarcode("");
    setQty(1);
    setScanned(false);
    setCameraActive(false);
  };

  const restartScanner = () => {
    resetScannerUI();
    setCameraActive(true);
    startScanAnimation();
  };

  /* ================= TAB FOCUS ================= */
  useFocusEffect(
    useCallback(() => {
      resetScannerUI();
      initScanner();

      return () => {
        resetScannerUI();
      };
    }, [permission, selectedMall])
  );

  /* ================= INIT ================= */
  const initScanner = async () => {
    if (!selectedMall) {
      setInitializing(false);
      Alert.alert(
        "Select a Mall",
        "Please select a nearby mall before scanning",
        [{ text: "OK", onPress: () => navigation.navigate("HomeTab") }]
      );
      return;
    }

    if (permission === null || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Camera access is required to scan products"
        );
        setInitializing(false);
        return;
      }
    }

    setCameraActive(true);
    setInitializing(false);
    startScanAnimation();
  };

  /* ================= BARCODE ================= */
  const handleBarcodeScanned = (data: string) => {
    if (scanned) return;

    setScanned(true);
    setCameraActive(false);
    Vibration.vibrate(60);

    searchProduct(data);
  };

  /* ================= SEARCH ================= */
  const searchProduct = async (code: string) => {
    if (!code) {
      Alert.alert("Invalid barcode");
      restartScanner();
      return;
    }

    try {
      const res = await api.post("products/scan/", {
        barcode: code,
        mall_id: selectedMall?.id,
      });

      setQty(1);
      setPreviewProduct(res.data);
    } catch {
      Alert.alert(
        "Not Found",
        "Product not found in this mall",
        [{ text: "Scan Again", onPress: restartScanner }]
      );
    }
  };

  /* ================= ADD TO CART ================= */
  const handleAddToCart = async () => {
    const product = previewProduct;

    // 🔥 CLOSE MODAL FIRST
    setPreviewProduct(null);

    try {
      await addToCart(product.id, qty);

      Alert.alert("Added to Cart", "Product added successfully", [
        { text: "Scan Again", onPress: restartScanner },
        { text: "Go to Cart", onPress: () => navigation.navigate("CartTab") },
      ]);
    } catch {
      Alert.alert("Error", "Unable to add product to cart");
      restartScanner();
    }
  };

  /* ================= LOADING ================= */
  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Initializing scanner…</Text>
      </View>
    );
  }

  /* ================= RENDER ================= */
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>
        Scan in {selectedMall?.name}
      </Text>

      {/* CAMERA */}
      {cameraActive && permission?.granted && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
            }}
            onBarcodeScanned={({ data }) => handleBarcodeScanned(data)}
          />

          {/* OVERLAY */}
          <View style={styles.overlay}>
            <View style={styles.overlayBlock} />
            <View style={styles.middleRow}>
              <View style={styles.overlayBlock} />

              <View style={styles.scanBox}>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 240],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>

              <View style={styles.overlayBlock} />
            </View>
            <View style={styles.overlayBlock} />
          </View>

          <Text style={styles.instruction}>
            Align barcode inside the frame
          </Text>
        </View>
      )}

      {/* MANUAL ENTRY */}
      <TouchableOpacity
        style={styles.manualBtn}
        onPress={() => {
          resetScannerUI();
          setManualOpen(true);
        }}
      >
        <Text style={styles.manualText}>
          Enter barcode manually
        </Text>
      </TouchableOpacity>

      {/* MANUAL MODAL */}
      <Modal visible={manualOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Barcode</Text>

            <TextInput
              placeholder="Barcode number"
              keyboardType="numeric"
              value={barcode}
              onChangeText={setBarcode}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                setManualOpen(false);
                searchProduct(barcode);
              }}
            >
              <Text style={styles.btnText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={restartScanner}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRODUCT PREVIEW MODAL */}
      <Modal visible={!!previewProduct} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.productCard}>
            {/* IMAGE */}
            {previewProduct?.image ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: previewProduct.image }}
                  style={styles.productImage}
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {previewProduct?.name?.[0]}
                </Text>
              </View>
            )}

            {/* INFO */}
            <Text style={styles.productName}>
              {previewProduct?.name}
            </Text>

            <Text style={styles.productPrice}>
              ₹{previewProduct?.price}
            </Text>

            {/* QTY */}
            <View style={styles.qtyPill}>
              <TouchableOpacity
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={20} />
              </TouchableOpacity>

              <Text style={styles.qtyValue}>{qty}</Text>

              <TouchableOpacity
                onPress={() => setQty((q) => q + 1)}
              >
                <Ionicons name="add" size={20} />
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddToCart}
            >
              <Text style={styles.addBtnText}>
                Add to Cart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={restartScanner}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ======================================================
   STYLES
====================================================== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  title: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 12,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBlock: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  middleRow: {
    flexDirection: "row",
  },
  scanBox: {
    width: 260,
    height: 260,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2563EB",
    overflow: "hidden",
  },
  scanLine: {
    height: 2,
    backgroundColor: "#22D3EE",
  },
  instruction: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    color: "#fff",
    fontWeight: "600",
  },
  manualBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  manualText: {
    color: "#60A5FA",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  cancel: {
    marginTop: 14,
    textAlign: "center",
    color: "#EF4444",
    fontWeight: "600",
  },
  productBox: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 24,
    borderRadius: 18,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: "#16A34A",
    fontWeight: "700",
    marginBottom: 16,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#94A3B8",
  },
  productCard: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },

  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
  },

  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 18,
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

  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 20,
  },

  qtyValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  addBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },

  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

});
