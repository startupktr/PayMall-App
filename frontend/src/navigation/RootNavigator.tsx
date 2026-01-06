import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return null; // Splash handles UI
  }
  return (
    <NavigationContainer>
      <Stack.Navigator
        id="RootStack"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ presentation: "modal" }} // 👈 login overlays app
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

