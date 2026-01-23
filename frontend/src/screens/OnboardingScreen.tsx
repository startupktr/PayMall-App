import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/utils/storageKeys";
import { navigationRef } from "@/navigation/navigationRef";

const { width } = Dimensions.get("window");

type Slide = {
  title: string;
  description: string;
};

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const slides: Slide[] = useMemo(
    () => [
      {
        title: "Enable Location & Choose a Mall",
        description:
          "Turn on location access and pick the mall you’re shopping in. This unlocks accurate product listings, real-time pricing, and exclusive offers before you scan anything.",
      },
      {
        title: "Scan Products Instantly",
        description:
          "Scan the barcode on the back of any product to instantly see full details, live pricing, and offers — then add it to your cart in seconds.",
      },
      {
        title: "Pay in-App & Skip the Queue",
        description:
          "Checkout directly through the app and avoid billing lines completely. No counters, no waiting — just pay, walk out, and keep moving.",
      },
    ],
    []
  );

  const complete = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, "true");

    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex((p) => p + 1);
    } else {
      complete();
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={complete} hitSlop={10}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.illustrationBox}>
              <Text style={styles.brand}>PayMall</Text>
              <Text style={styles.tagline}>Scan • Pay • Go</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : null]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={goNext}>
          <Text style={styles.btnText}>
            {index === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 35,
    paddingTop: 60,
    alignItems: "flex-end",
  },
  skip: { fontSize: 18, color: "#8A8A8A", fontWeight: "700" },

  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  illustrationBox: {
    width: width - 44,
    height: 240,
    borderRadius: 18,
    backgroundColor: "#c5d6ef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  brand: { fontSize: 28, fontWeight: "900", color: "#111" },
  tagline: { marginTop: 6, fontSize: 13, fontWeight: "700", color: "#666" },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    fontSize: 15.5,
    lineHeight: 22,
    color: "#555555",
    textAlign: "center",
  },

  footer: {
    paddingHorizontal: 18,
    paddingBottom: 60,
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 5,
  },
  dotActive: {
    width: 18,
    backgroundColor: "#111",
  },

  btn: {
    backgroundColor: "#9ccac7",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#111", fontSize: 18, fontWeight: "800" },
});
