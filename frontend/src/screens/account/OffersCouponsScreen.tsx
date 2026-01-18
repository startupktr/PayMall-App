// OffersCouponsScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";

const offers = [
  { id: "1", title: "₹200 OFF", active: true },
  { id: "2", title: "10% Cashback", active: false },
];

export default function OffersCouponsScreen() {
  const [showActive, setShowActive] = useState(true);

  const filtered = offers.filter(o => o.active === showActive);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Tab label="Active" active={showActive} onPress={() => setShowActive(true)} />
        <Tab label="Expired" active={!showActive} onPress={() => setShowActive(false)} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.title}</Text>
            <Text style={item.active ? styles.primary : styles.expired}>
              {item.active ? "Valid" : "Expired"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const Tab = ({ label, active, onPress }: any) => (
  <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
    <Text style={active && styles.activeText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF7F5", padding: 16 },
  tabs: { flexDirection: "row", marginBottom: 16 },
  tab: { flex: 1, padding: 12, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#2FA4A9" },
  activeText: { color: "#2FA4A9", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  primary: { color: "#2FA4A9" },
  expired: { color: "#999" },
});
