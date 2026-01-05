import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
  setTimeout(() => {
    navigation.replace("Auth"); // goes to Login
  }, 2500);
}, []);


  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/Splash-Icon.png")} // optional
        style={styles.logo}
      />

      <Text style={styles.title}>PayMall</Text>
      <Text style={styles.tagline}>Scan • Pay • Go</Text>
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
  },
  tagline: {
    fontSize: 18,
    marginTop: 8,
    color: "#080808ff",
    letterSpacing: 1,
    fontWeight: "bold",
  },
});
