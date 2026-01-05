import { Text, View } from "react-native";

export default function ExitOTPScreen({ route }: any) {
  return (
    <View>
      <Text style={{ fontSize: 40 }}>{route.params.otp}</Text>
    </View>
  );
}
