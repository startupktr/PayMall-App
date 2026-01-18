// AppSettingsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function AppSettingsScreen() {
  return (
    <View style={styles.container}>
      <Setting label="Language" value="English" />
      <Setting label="Currency" value="INR (₹)" />
      <Setting label="Theme" value="Light" />
    </View>
  );
}

const Setting = ({ label, value }: any) => (
  <TouchableOpacity style={styles.card}>
    <Text>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF7F5", padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  value: { color: "#666" },
});
