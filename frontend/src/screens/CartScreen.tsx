import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import api from "../api/axios";

export default function CartScreen({ navigation }: any) {
  const [cart, setCart] = useState<any>(null);

  useEffect(() => {
    api.get("cart/").then(res => setCart(res.data));
  }, []);

  if (!cart) return <Text>Empty</Text>;

  return (
    <View>
      {cart.items.map((i: any) => (
        <Text key={i.id}>{i.product_name} x {i.quantity}</Text>
      ))}
      <Button title="Checkout" onPress={() => navigation.navigate("Checkout")} />
    </View>
  );
}
