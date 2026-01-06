import { createStackNavigator } from "@react-navigation/stack";
import BottomTabNavigator from "./MainTabs";

const Stack = createStackNavigator<any, any>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
}

export default AppNavigator;