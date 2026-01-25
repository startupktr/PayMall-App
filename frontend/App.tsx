import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { MallProvider } from "./src/context/MallContext";
import { CartProvider } from "./src/context/CartContext";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import AuthGateModal from "./src/components/AuthGateModal";
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

const App = () => {

  // Inside your main App component
  useEffect(() => {
    async function updateApp() {
      if (__DEV__) return; // Don't check in development
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync(); // App restarts with new code
      }
    }
    updateApp();
  }, []);

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
