import { useAuth } from "../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { RootStackParamList } from "../types/navigation"

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigation = useNavigation<RootNavProp>();
  const route = useRoute<any>();

  useEffect(() => {
    if (!loading && !user) {
      navigation.navigate("Auth", {
        redirectTo: route.name,
        redirectParams: route.params,
      });
    }
  }, [loading, user]);

  if (!user) return null;
  return <>{children}</>;
}
