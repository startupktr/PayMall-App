import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { MallProvider } from './src/context/MallContext';
import { CartProvider } from './src/context/CartContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MallProvider>
          <CartProvider>
            <RootNavigator />
          </CartProvider>
        </MallProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
