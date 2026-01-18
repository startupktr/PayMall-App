// PrivacySettingsScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

export default function PrivacySettingsScreen() {
  const [dataSharing, setDataSharing] = useState(true);
  const [ads, setAds] = useState(false);
  const [location, setLocation] = useState(true);

  return (
    <View style={styles.container}>
      <PrivacyToggle label="Data Sharing" value={dataSharing} setValue={setDataSharing} />
      <PrivacyToggle label="Ad Personalization" value={ads} setValue={setAds} />
      <PrivacyToggle label="Location Access" value={location} setValue={setLocation} />
    </View>
  );
}

const PrivacyToggle = ({ label, value, setValue }: any) => (
  <View style={styles.card}>
    <Text>{label}</Text>
    <Switch value={value} onValueChange={setValue} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF7F5", padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
