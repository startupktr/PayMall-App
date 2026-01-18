import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { MallProvider } from "./src/context/MallContext";
import { CartProvider } from "./src/context/CartContext";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import AuthGateModal from "./src/components/AuthGateModal";

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        {/* ✅ Mall must be above Cart (Cart uses selectedMall) */}
        <MallProvider>
          {/* ✅ Cart must be above Auth (Auth uses useCart) */}
          <CartProvider>
            <AuthProvider>
              <AuthGateModal />
              <RootNavigator />
            </AuthProvider>
          </CartProvider>
        </MallProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
