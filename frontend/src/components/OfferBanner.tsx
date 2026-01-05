import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type OfferBannerProps = {
  mallName: string;
  title: string;
  subtitle: string;
  image: string;
  onPress: () => void;
};

export default function OfferBanner({
  mallName,
  title,
  subtitle,
  image,
  onPress,
}: OfferBannerProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={["#0F766E", "#0D9488"]}
        style={styles.card}
      >
        {/* Left */}
        <View style={styles.left}>
          <Text style={styles.mall}>{mallName}</Text>
          <Text style={styles.offer}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>

          <View style={styles.cta}>
            <Text style={styles.ctaText}>Shop Now</Text>
          </View>
        </View>

        {/* Right */}
        <Image source={{ uri: image }} style={styles.image} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    marginHorizontal: 3,
    marginVertical: 8,
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  left: {
    flex: 1,
  },

  mall: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CCFBF1",
  },

  offer: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },

  sub: {
    fontSize: 13,
    color: "#ECFEFF",
  },

  cta: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginLeft: 12,
  },
});
