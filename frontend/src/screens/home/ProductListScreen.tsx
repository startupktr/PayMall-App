import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import api from "@/api/axios";

export default function ProductListScreen({ route, navigation }: any) {
  const { mallId } = route.params;
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.get(`products/?mall_id=${mallId}`).then(res => setProducts(res.data));
  }, []);

  return (
    <View>
      {products.map(p => (
        <View key={p.id}>
          <Text>{p.name}</Text>
          <Text>₹ {p.price}</Text>
          <Button
            title="Scan to Add"
            onPress={() =>
              navigation.navigate("Scanner", { mallId })
            }
          />
        </View>
      ))}
    </View>
  );
}
