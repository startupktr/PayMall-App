import { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import api from "../api/axios";

const MallListScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("products/")
      .then(res => {
        console.log("MALLS:", res.data); // 👈 debug
        setProducts(res.data);              // 👈 THIS WAS MISSING
      })
      .catch(err => {
        console.log("ERROR:", err.message);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Mall Screen!</Text>

      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate("Products", { mallId: item.id })
            }
          >
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No malls found</Text>}
      />
    </View>
  );
};

export default MallListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  item: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemText: {
    fontSize: 16,
  },
});
