// ReferralsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ReferralsScreen() {
  const referralCode = "PAYMALL50";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Invite friends & earn rewards</Text>
        <Text>Your referral code</Text>
        <Text style={styles.code}>{referralCode}</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn}>
        <Text style={styles.shareText}>Share Invite</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF7F5", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  title: { fontWeight: "600", marginBottom: 10 },
  code: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2FA4A9",
    marginTop: 8,
  },
  shareBtn: {
    backgroundColor: "#2FA4A9",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  shareText: { color: "#fff", fontWeight: "600" },
});
