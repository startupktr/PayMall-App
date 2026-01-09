import React, { createContext, useContext, useState } from "react";
import api from "../api/axios";

type CartItem = {
  id: number;
  product: any;
  quantity: number;
};

type Cart = {
  id: number;
  mall: number;
  items: CartItem[];
};

type CartContextType = {
  cart: Cart | null;
  count: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, qty?: number) => Promise<void>;
  updateItem: (cartItemId: number, qty: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>(
  {} as CartContextType
);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);

  /* ================= FETCH CART ================= */
  const fetchCart = async () => {
    try {
      const res = await api.get("cart/");
      setCart(res.data?.items ? res.data : null);
    } catch {
      setCart(null);
    }
  };

  /* ================= ADD TO CART ================= */
  const addToCart = async (productId: number, qty = 1) => {
    const res = await api.post("cart/add/", {
      product_id: productId,
      quantity: qty,
    });

    setCart(res.data); // 🔑 backend is source of truth
  };

  /* ================= UPDATE ITEM ================= */
  const updateItem = async (cartItemId: number, qty: number) => {
    await api.patch("cart/item/update/", {
      cart_item_id: cartItemId,
      quantity: qty,
    });

    await fetchCart();
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = async (cartItemId: number) => {
    await api.delete("cart/item/remove/", {
      data: { cart_item_id: cartItemId },
    });

    await fetchCart();
  };

  /* ================= CLEAR CART ================= */
  const clearCart = async () => {
    await api.delete("cart/clear/");
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        count: cart
          ? cart.items.reduce((s, i) => s + i.quantity, 0)
          : 0,
        fetchCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
