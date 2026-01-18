import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CartScreen from "@/screens/cart/CartScreen";
import CheckoutScreen from "@/screens/cart/CheckoutScreen";
import PaymentScreen from "@/screens/cart/PaymentScreen";
import PaymentResultScreen from "@/screens/cart/PaymentResultScreen";
import PaymentProcessingScreen from "@/screens/cart/PaymentProcessingScreen";

const Stack = createNativeStackNavigator();

export default function CartStack() {
    return (
        <Stack.Navigator
            id="CartStack"
            screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} />
            <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
        </Stack.Navigator>
    );
}
