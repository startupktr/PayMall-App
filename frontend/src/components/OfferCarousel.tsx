import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { Offer } from "@/types/offer";

type Props = {
  offers: Offer[];
  onPress: (mallId: any) => void; // keep flexible (uuid/number)
};

export default function OfferCarousel({ offers, onPress }: Props) {
  const flatListRef = useRef<FlatList>(null);

  // ✅ responsive width
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // ✅ This carousel is rendered inside a parent with paddingHorizontal:16
  // We want banner to look perfect + centered (NOT shifted)
  const SIDE_GAP = 16; // same as HomeScreen padding

  // ✅ Full width carousel slide
  const slideWidth = SCREEN_WIDTH;

  // ✅ Banner visible area inside slide (with same 16px margin)
  const bannerWidth = slideWidth - SIDE_GAP * 2;

  // ✅ 1280×640 => 2:1
  const bannerHeight = Math.round(bannerWidth / 2);

  // ✅ infinite loop data
  const loopData = useMemo(() => {
    if (offers.length <= 1) return offers;
    return [offers[offers.length - 1], ...offers, offers[0]];
  }, [offers]);

  // ✅ index in loopData space
  const [index, setIndex] = useState(offers.length > 1 ? 1 : 0);

  // ✅ autoplay
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDraggingRef = useRef(false);
  const isListReadyRef = useRef(false);

  // ✅ preload + fallback
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  /* ================= IMAGE PRELOAD ================= */
  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      try {
        const urls = offers
          .map((o) => o.image)
          .filter(Boolean)
          .slice(0, 10);

        await Promise.all(
          urls.map((uri) => {
            return new Promise<void>((resolve) => {
              Image.prefetch(uri)
                .then(() => resolve())
                .catch(() => resolve());
            });
          })
        );

        if (!cancelled) {
          setLoadedImages((prev) => {
            const next = { ...prev };
            urls.forEach((u) => (next[u] = true));
            return next;
          });
        }
      } catch {
        // ignore
      }
    };

    preload();
    return () => {
      cancelled = true;
    };
  }, [offers]);

  /* ================= AUTOPLAY HELPERS ================= */

  const clearAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const safeScrollToIndex = useCallback(
    (targetIndex: number, animated: boolean) => {
      if (!flatListRef.current) return;
      if (!isListReadyRef.current) return;

      try {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated,
        });
      } catch {
        // ignore
      }
    },
    []
  );

  const startAutoPlay = useCallback(() => {
    if (offers.length <= 1) return;

    clearAutoPlay();

    timerRef.current = setInterval(() => {
      if (isDraggingRef.current) return;

      safeScrollToIndex(index + 1, true);
      setIndex((prev) => prev + 1);
    }, 3500);
  }, [offers.length, clearAutoPlay, safeScrollToIndex, index]);

  useEffect(() => {
    startAutoPlay();
    return () => clearAutoPlay();
  }, [startAutoPlay, clearAutoPlay]);

  /* ================= RESET WHEN OFFERS CHANGE ================= */

  useEffect(() => {
    if (offers.length > 1) {
      setIndex(1);
      setTimeout(() => safeScrollToIndex(1, false), 50);
    } else {
      setIndex(0);
    }
  }, [offers.length, safeScrollToIndex]);

  /* ================= LOOP JUMP ================= */

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (offers.length <= 1) return;

    const currentIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setIndex(currentIndex);

    // fake last -> jump to real first
    if (currentIndex === loopData.length - 1) {
      setTimeout(() => {
        safeScrollToIndex(1, false);
        setIndex(1);
      }, 30);
    }

    // fake first -> jump to real last
    if (currentIndex === 0) {
      setTimeout(() => {
        safeScrollToIndex(offers.length, false);
        setIndex(offers.length);
      }, 30);
    }
  };

  /* ================= DOTS ================= */

  const activeDotIndex =
    offers.length <= 1 ? 0 : (index - 1 + offers.length) % offers.length;

  const onDotPress = (dotIndex: number) => {
    if (offers.length <= 1) return;

    const targetLoopIndex = dotIndex + 1;

    isDraggingRef.current = true;
    clearAutoPlay();

    safeScrollToIndex(targetLoopIndex, true);
    setIndex(targetLoopIndex);

    setTimeout(() => {
      isDraggingRef.current = false;
      startAutoPlay();
    }, 800);
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={loopData}
        horizontal
        pagingEnabled

        // ✅ smooth snap
        snapToInterval={slideWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum

        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `offer-${i}`}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: slideWidth,
          offset: slideWidth * i,
          index: i,
        })}

        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
          clearAutoPlay();
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
            startAutoPlay();
          }, 800);
        }}

        onLayout={() => {
          isListReadyRef.current = true;
        }}

        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            safeScrollToIndex(info.index, false);
          }, 50);
        }}

        renderItem={({ item }) => {
          const uri = item.image;
          const isLoaded = !!loadedImages[uri];

          return (
            <View style={[styles.slide, { width: slideWidth }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onPress(item.mall_id)}
                style={[
                  styles.bannerWrap,
                  {
                    width: bannerWidth,
                    height: bannerHeight,
                    marginHorizontal: SIDE_GAP, // ✅ PERFECT alignment
                  },
                ]}
              >
                {!isLoaded && <View style={styles.fallback} />}

                <Image
                  source={{ uri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                  onLoadEnd={() => {
                    setLoadedImages((prev) => ({ ...prev, [uri]: true }));
                  }}
                />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* ✅ Clickable dots */}
      {offers.length > 1 && (
        <View style={styles.dots}>
          {offers.map((_, i) => {
            const isActive = i === activeDotIndex;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => onDotPress(i)}
                style={[styles.dot, isActive && styles.activeDot]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    justifyContent: "center",
  },

  bannerWrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2E8F0",
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
