import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import PaymentScreen from "../screens/PaymentScreen";
import PaymentResultScreen from "../screens/PaymentResultScreen";
import RequireAuth from "../components/RequireAuth";
import PaymentProcessingScreen from "../screens/PaymentProcessingScreen";

const Stack = createNativeStackNavigator();

export default function CartStack() {
    return (
        <RequireAuth>
            <Stack.Navigator
                id="CartStack"
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} />
                <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
            </Stack.Navigator>
        </RequireAuth>
    );
}
