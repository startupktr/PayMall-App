// PaymentMethodsScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";

const mockUPIApps = ["Google Pay", "PhonePe", "Paytm"];
const mockCards = [
  { id: "1", brand: "Visa", last4: "4242", isDefault: true },
  { id: "2", brand: "Mastercard", last4: "8899", isDefault: false },
];

export default function PaymentMethodsScreen() {
  const [cards, setCards] = useState(mockCards);

  const setDefault = (id: string) => {
    setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.section}>UPI Apps on your phone</Text>
      {mockUPIApps.map(app => (
        <View key={app} style={styles.card}>
          <Text>{app}</Text>
          <Text style={styles.primary}>Available</Text>
        </View>
      ))}

      <Text style={styles.section}>Saved Cards</Text>
      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.brand} •••• {item.last4}</Text>
            <TouchableOpacity onPress={() => setDefault(item.id)}>
              <Text style={item.isDefault ? styles.primary : styles.link}>
                {item.isDefault ? "Default" : "Set as Default"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.addBtn}>
        <Text style={styles.addText}>+ Add New Card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF7F5", padding: 16 },
  section: { fontWeight: "600", marginVertical: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primary: { color: "#2FA4A9", fontWeight: "600" },
  link: { color: "#888" },
  addBtn: {
    marginTop: 20,
    backgroundColor: "#2FA4A9",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  addText: { color: "#fff", fontWeight: "600" },
});
