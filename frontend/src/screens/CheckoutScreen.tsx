import { Button } from "react-native";
import api from "../api/axios";

export default function CheckoutScreen({ navigation }: any) {
  const pay = async () => {
    const order = await api.post("orders/create/");
    const payment = await api.post("payment/initiate/", {
      order_id: order.data.order_id,
      provider: "mock",
    });
    const success = await api.post("payment/success/", {
      payment_id: payment.data.payment_id,
      gateway_payment_id: "123",
    });
    navigation.navigate("ExitOTP", { otp: success.data.exit_otp });
  };

  return <Button title="Pay Now" onPress={pay} />;
}
