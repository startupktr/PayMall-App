import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Animated, StatusBar } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/utils/storageKeys";
import { useAuth } from "@/context/AuthContext";
import { VideoView, useVideoPlayer } from "expo-video";

type Props = NativeStackScreenProps<any>;

export default function SplashScreen({ navigation }: Props) {
  const { user, loading } = useAuth();

  const [videoDone, setVideoDone] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasNavigatedRef = useRef(false);

  // ✅ Make sure this matches your real video length (ms)
  const VIDEO_MS = 4900; // change if your video is longer

  const player = useVideoPlayer(require("@/../assets/splash.mp4"), (p) => {
    p.loop = false;
    p.muted = true;
    p.currentTime = 0;
    p.play();
  });

  // ✅ Video completion (with fallback timeout)
  useEffect(() => {
    const fallback = setTimeout(() => {
      setVideoDone(true);
    }, VIDEO_MS + 300); // ✅ buffer

    // ✅ expo-video event may vary, so we add safest approach:
    // When playback finishes, mark done
    const sub = player?.addListener?.("playToEnd", () => {
      clearTimeout(fallback);
      setVideoDone(true);
    });

    return () => {
      clearTimeout(fallback);
      sub?.remove?.();
    };
  }, [player]);

  const goNext = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      try {
        if (!user) {
          navigation.replace("Auth");
          return;
        }

        const done = await AsyncStorage.getItem(STORAGE_KEYS.APP_ONBOARDING_DONE);

        if (done !== "true") {
          navigation.replace("Onboarding");  // ✅ first install → onboarding
          return;
        }

        // ✅ onboarding already done
        if (user) {
          navigation.replace("Main");
        } else {
          navigation.replace("Auth");
        }

      } catch {
        navigation.replace(user ? "Main" : "Auth");
      }
    });
  };

  // ✅ Navigate only when BOTH are ready:
  // - auth finished
  // - video finished
  useEffect(() => {
    if (loading) return;
    if (!videoDone) return;

    goNext();
  }, [loading, videoDone, user]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
