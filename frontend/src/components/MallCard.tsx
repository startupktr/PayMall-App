import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

type Props = {
  name: string;
  image?: string | null;
  tagline?: string;
  distance?: number; // meters
  onPress?: () => void;
};

export default function MallCard({
  name,
  image,
  tagline = "Shopping • Food • Fashion",
  distance,
  onPress,
}: Props) {
  const firstLetter = name.charAt(0).toUpperCase();

  const formattedDistance =
    distance !== undefined
      ? distance >= 1000
        ? `${(distance / 1000).toFixed(1)} Km`
        : `${Math.round(distance)} m`
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Image / Letter */}
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{firstLetter}</Text>
        </View>
      )}

      {/* Text */}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>

      <Text style={styles.tagline} numberOfLines={1}>
        {tagline}
      </Text>

      {formattedDistance && (
        <Text style={styles.distance}>{formattedDistance} Away</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 90,
    borderRadius: 12,
    marginBottom: 10,
  },

  placeholder: {
    width: "100%",
    height: 90,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#475569",
  },

  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#020617",
  },

  tagline: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  distance: {
    fontSize: 11,
    color: "#0F766E",
    marginTop: 4,
    fontWeight: "600",
  },
});
