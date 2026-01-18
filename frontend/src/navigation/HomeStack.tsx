import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "@/screens/home/HomeScreen";
import MallDetailsScreen from "@/screens/home/MallDetailsScreen";
import { HomeStackParamList } from "@/types/navigation";
import MallProductDetailsScreen from "@/screens/home/MallProductDetailsScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      id="HomeStack"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MallDetails" component={MallDetailsScreen} />
      <Stack.Screen name="MallProductDetails" component={MallProductDetailsScreen} />
    </Stack.Navigator>
  );
}
