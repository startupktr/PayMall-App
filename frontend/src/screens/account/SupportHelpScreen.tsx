// SupportHelpScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function SupportHelpScreen() {
  return (
    <View style={styles.container}>
      <SupportItem title="Chat with Support" />
      <SupportItem title="My Tickets" />
      <SupportItem title="Call Support" />
      <SupportItem title="FAQs" />
    </View>
  );
}

const SupportItem = ({ title }: any) => (
  <TouchableOpacity style={styles.card}>
    <Text>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF7F5", padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },
});
