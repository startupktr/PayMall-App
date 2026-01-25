import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/utils/storageKeys";
import { useAuth } from "@/context/AuthContext";

import { VideoView, useVideoPlayer } from "expo-video";

type Props = NativeStackScreenProps<any>;

export default function SplashScreen({ navigation }: Props) {
  const { user, loading } = useAuth();
  const [videoDone, setVideoDone] = useState(false);

  const player = useVideoPlayer(require("@/../assets/splash.mp4"), (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  // ✅ detect video end
  useEffect(() => {
    const sub = player.addListener("playToEnd", () => {
      setVideoDone(true);
    });

    return () => sub.remove();
  }, [player]);

  // ✅ navigate after video finishes + auth loaded
  useEffect(() => {
    if (loading) return;
    if (!videoDone) return;

    const goNext = async () => {
      if (!user) {
        navigation.replace("Auth");
        return;
      }

      const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
      navigation.replace(seen !== "true" ? "Onboarding" : "Main");
    };

    goNext();
  }, [loading, user, videoDone]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // fallback while video loads
  },
});
