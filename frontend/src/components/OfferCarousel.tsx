import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import OfferBanner from "./OfferBanner";
import { Offer } from "../types/offer";

const { width } = Dimensions.get("window");

type Props = {
  offers: Offer[];
  onPress: (mallId: number) => void;
};

export default function OfferCarousel({ offers, onPress }: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (index + 1) % offers.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setIndex(nextIndex);
    }, 3500);

    return () => clearInterval(timer);
  }, [index, offers.length]);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={offers}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OfferBanner
            mallName={item.mall_name}
            title={item.title}
            subtitle={item.description}
            image={item.image}
            onPress={() => onPress(item.mall_id)}
          />
        )}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setIndex(i);
        }}
      />

      {/* Pagination dots */}
      <View style={styles.dots}>
        {offers.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#0F766E",
    width: 10,
  },
});
