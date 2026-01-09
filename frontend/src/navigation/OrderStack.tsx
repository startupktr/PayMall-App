import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrdersScreen from "../screens/OrdersScreen";
import RequireAuth from "../components/RequireAuth";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";

const Stack = createNativeStackNavigator();

export default function CartStack() {
    return (
        <RequireAuth>
            <Stack.Navigator
                id="OrderStack"
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Orders" component={OrdersScreen} />
                <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            </Stack.Navigator>
        </RequireAuth>
    );
}
