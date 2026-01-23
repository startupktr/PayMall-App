import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/utils/storageKeys";

type Props = NativeStackScreenProps<any>;

export default function SplashScreen({ navigation }: Props) {
  const { user, loading } = useAuth();

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslate, {
        toValue: 0,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      // ✅ Not logged in
      if (!user) {
        navigation.replace("Auth");
        return;
      }

      // ✅ Logged in: show onboarding only once
      const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);

      if (seen !== "true") {
        navigation.replace("Onboarding");
      } else {
        navigation.replace("Main");
      }
    }, 1800); // little faster feels better

    return () => clearTimeout(timer);
  }, [loading, user]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("@/../assets/Splash-Icon.png")}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      />

      <Animated.View style={{ transform: [{ translateY: textTranslate }] }}>
        <Text style={styles.title}>PayMall</Text>
        <Text style={styles.tagline}>Scan • Pay • Go</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#59c4b6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    marginTop: 8,
    color: "#080808ff",
    letterSpacing: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
});
