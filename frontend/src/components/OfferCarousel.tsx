import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Offer } from "@/types/offer";

const { width } = Dimensions.get("window");

type Props = {
  offers: Offer[];
  onPress: (mallId: number) => void;
};

export default function OfferCarousel({ offers, onPress }: Props) {
  const flatListRef = useRef<FlatList>(null);

  /**
   * ✅ To make infinite loop seamless:
   * We create a list like: [last, ...original, first]
   * Then start at index 1.
   */
  const loopData = useMemo(() => {
    if (offers.length <= 1) return offers;
    return [offers[offers.length - 1], ...offers, offers[0]];
  }, [offers]);

  const [index, setIndex] = useState(offers.length > 1 ? 1 : 0);

  // ✅ Autoplay
  useEffect(() => {
    if (offers.length <= 1) return;

    const timer = setInterval(() => {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
      setIndex((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [index, offers.length]);

  // ✅ initial position = 1
  useEffect(() => {
    if (offers.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 1, animated: false });
      }, 10);
    }
  }, [offers.length]);

  // ✅ On scroll end: handle seamless loop jump
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (offers.length <= 1) return;

    const currentIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(currentIndex);

    // If we reached fake last (which is original first)
    if (currentIndex === loopData.length - 1) {
      // jump to real first (index=1) without animation
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 1, animated: false });
        setIndex(1);
      }, 10);
    }

    // If we reached fake first (which is original last)
    if (currentIndex === 0) {
      // jump to real last (index=offers.length) without animation
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: offers.length,
          animated: false,
        });
        setIndex(offers.length);
      }, 10);
    }
  };

  /**
   * ✅ Pagination dot index should map to ORIGINAL offers
   * realIndex = (index - 1) for looped data
   */
  const activeDotIndex =
    offers.length <= 1 ? 0 : (index - 1 + offers.length) % offers.length;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={loopData}
        horizontal
        pagingEnabled
        snapToInterval={width}           // ✅ snap properly
        decelerationRate="fast"          // ✅ iOS smooth
        snapToAlignment="start"          // ✅ no mid-stuck
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `offer-${i}`}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(item.mall_id)}
            style={styles.bannerWrap}
          >
            <Image source={{ uri: item.image }} style={styles.bannerImage} />
          </TouchableOpacity>
        )}
      />

      {/* Pagination dots */}
      {offers.length > 1 && (
        <View style={styles.dots}>
          {offers.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeDotIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    width,
    alignItems: "center",
    justifyContent: "center",
    // paddingHorizontal: 1,
    left: -15
  },

  bannerImage: {
    width: "91%",
    height: 164,
    borderRadius: 16,
    resizeMode: "contain",
    backgroundColor: "#111"
  },

  fallback: {
    width: "91%",
    height: 164,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  fallbackBox: {
    flex: 1,
  },

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
