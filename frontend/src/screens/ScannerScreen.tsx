import { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import api from "../api/axios";

interface ScannerProps {
  route: {
    params: {
      mallId: number;
    };
  };
  navigation: any;
}

export default function ScannerScreen({ route, navigation }: ScannerProps) {
  const { mallId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.link}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async (result: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);

    try {
      await api.post("scan/", {
        barcode: result.data,
        mall_id: mallId,
      });

      navigation.navigate("Cart");
    } catch (err) {
      setScanned(false);
      alert("Scan failed");
    }
  };

  return (
    <CameraView
      style={{ flex: 1 }}
      barcodeScannerSettings={{
        barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
      }}
      onBarcodeScanned={handleScan}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    marginTop: 10,
    color: "blue",
  },
});
