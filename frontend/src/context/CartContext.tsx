import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/api/axios";
import * as SecureStore from "expo-secure-store";
import { useMall } from "@/context/MallContext";

/* ================= TYPES ================= */

export type CartItem = {
  id: number; // guest uses product id
  quantity: number;
  total_price: string;
  product: {
    id: number;
    name: string;
    price: string; // inclusive
    image?: string | null;
  };
};

export type Cart = {
  id: number; // guest = 0
  mall: string | number;
  items: CartItem[];

  total_amount: string;
  taxable_subtotal: string;
  gst_total: string;
  cgst: string;
  sgst: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: any;
};

type CartContextType = {
  cart: Cart | null;
  count: number;
  isGuest: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (
    product: { id: number; name: string; price: string; image?: string | null },
    qty?: number
  ) => Promise<void>;
  updateItem: (cartItemId: number, qty: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // ✅ used after login
  mergeGuestCartIntoServer: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

/* ================= HELPERS ================= */

const toNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[₹,\s]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

const guestKey = (mallId: string | number) => `guest_cart_${String(mallId)}`;

const round2 = (x: number) => Math.round(x * 100) / 100;

const calculateGuestTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, it) => {
    const price = toNumber(it.product.price);
    return sum + price * it.quantity;
  }, 0);

  const payable = round2(total).toFixed(2);

  return {
    total_amount: payable,
    taxable_subtotal: payable,
    gst_total: "0.00",
    cgst: "0.00",
    sgst: "0.00",
  };
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { selectedMall } = useMall();
  const mallId = selectedMall?.id;

  const [cart, setCart] = useState<Cart | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  const count = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((s, i) => s + i.quantity, 0);
  }, [cart]);

  const refreshAuthMode = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    setIsGuest(!token);
  };

  useEffect(() => {
    refreshAuthMode();
  }, []);

  /* ✅ refresh cart whenever mall changes */
  useEffect(() => {
    if (!mallId) {
      setCart(null);
      return;
    }

    refreshAuthMode().finally(() => fetchCart());
  }, [mallId]);

  /* ✅ backend envelope */
  const setCartFromEnvelope = (res: ApiEnvelope<Cart>) => {
    if (res.success && res.data && res.data.items && res.data.items.length > 0) {
      setCart(res.data);
    } else {
      setCart(null);
    }
  };

  /* ================= GUEST STORAGE ================= */

  const getGuestCart = async (): Promise<Cart | null> => {
    if (!mallId) return null;

    const raw = await AsyncStorage.getItem(guestKey(mallId));
    if (!raw) return null;

    return JSON.parse(raw);
  };

  const saveGuestCart = async (c: Cart | null) => {
    if (!mallId) return;

    if (!c || !c.items?.length) {
      await AsyncStorage.removeItem(guestKey(mallId));
      return;
    }

    await AsyncStorage.setItem(guestKey(mallId), JSON.stringify(c));
  };

  /* ================= FETCH CART ================= */

  const fetchCart = async () => {
    try {
      if (!mallId) {
        setCart(null);
        return;
      }

      // ✅ ALWAYS detect auth at time of fetching
      const token = await SecureStore.getItemAsync("accessToken");
      const guest = !token;
      setIsGuest(guest);

      if (guest) {
        const local = await getGuestCart();
        setCart(local);
        return;
      }

      const res = (await api.get("cart/", {
        params: { mall_id: mallId },
        _silentAuth: true,
      })) as ApiEnvelope<Cart>;
      console.log("res:-", res)
      setCartFromEnvelope(res);
    } catch {
      setCart(null);
    }
  };

  /* ================= ADD TO CART ================= */

  const addToCart = async (
    product: { id: number; name: string; price: string; image?: string | null },
    qty = 1
  ) => {
    if (!mallId) throw new Error("No mall selected");

    // ✅ guest mode
    if (isGuest) {
      const existing =
        (await getGuestCart()) || ({
          id: 0,
          mall: mallId,
          items: [],
          total_amount: "0.00",
          taxable_subtotal: "0.00",
          gst_total: "0.00",
          cgst: "0.00",
          sgst: "0.00",
        } as Cart);

      const items = [...existing.items];
      const idx = items.findIndex((x) => x.product.id === product.id);

      if (idx >= 0) {
        const newQty = items[idx].quantity + qty;

        items[idx] = {
          ...items[idx],
          quantity: newQty,
          total_price: (toNumber(product.price) * newQty).toFixed(2),
        };
      } else {
        items.push({
          id: product.id, // guest unique id
          quantity: qty,
          total_price: (toNumber(product.price) * qty).toFixed(2),
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image ?? null,
          },
        });
      }

      const totals = calculateGuestTotals(items);

      const updated: Cart = {
        id: 0,
        mall: mallId,
        items,
        ...totals,
      };

      setCart(updated);
      await saveGuestCart(updated);
      return;
    }

    // ✅ logged-in
    const res = (await api.post("cart/add/", {
      product_id: product.id,
      quantity: qty,
    })) as ApiEnvelope<Cart>;

    setCartFromEnvelope(res);
  };

  /* ================= UPDATE ITEM ================= */

  const updateItem = async (cartItemId: number, qty: number) => {
    if (!mallId) return;

    // ✅ guest
    if (isGuest) {
      const existing = await getGuestCart();
      if (!existing) return;

      let items = [...existing.items];

      if (qty <= 0) {
        items = items.filter((x) => x.id !== cartItemId);
      } else {
        items = items.map((x) =>
          x.id === cartItemId
            ? {
              ...x,
              quantity: qty,
              total_price: (toNumber(x.product.price) * qty).toFixed(2),
            }
            : x
        );
      }

      if (!items.length) {
        setCart(null);
        await saveGuestCart(null);
        return;
      }

      const totals = calculateGuestTotals(items);
      const updated: Cart = { ...existing, items, ...totals };

      setCart(updated);
      await saveGuestCart(updated);
      return;
    }

    // ✅ auth
    const res = (await api.patch("cart/item/update/", {
      cart_item_id: cartItemId,
      quantity: qty,
    })) as ApiEnvelope<Cart>;

    setCartFromEnvelope(res);
  };

  /* ================= REMOVE ITEM ================= */

  const removeItem = async (cartItemId: number) => {
    if (!mallId) return;

    // ✅ guest
    if (isGuest) {
      const existing = await getGuestCart();
      if (!existing) return;

      const items = existing.items.filter((x) => x.id !== cartItemId);

      if (!items.length) {
        setCart(null);
        await saveGuestCart(null);
        return;
      }

      const totals = calculateGuestTotals(items);
      const updated: Cart = { ...existing, items, ...totals };

      setCart(updated);
      await saveGuestCart(updated);
      return;
    }

    // ✅ auth
    const res = (await api.delete("cart/item/remove/", {
      data: { cart_item_id: cartItemId },
    })) as ApiEnvelope<Cart>;

    setCartFromEnvelope(res);
  };

  /* ================= CLEAR CART ================= */

  const clearCart = async () => {
    if (!mallId) return;

    // ✅ guest
    if (isGuest) {
      setCart(null);
      await saveGuestCart(null);
      return;
    }

    // ✅ auth per mall clear
    await api.delete("cart/clear/", {
      params: { mall_id: mallId },
    });

    setCart(null);
  };

  /* ================= MERGE GUEST INTO SERVER ================= */

  const mergeGuestCartIntoServer = async () => {
    console.log("MallId:", mallId)
    if (!mallId) return;

    // only merge if currently guest cart exists
    const local = await getGuestCart();
    if (!local || !local.items?.length) return;

    const payload = {
      mall_id: mallId,
      items: local.items.map((x) => ({
        product_id: x.product.id,
        quantity: x.quantity,
      })),
    };

    const res = (await api.post("cart/merge-guest/", payload)) as ApiEnvelope<Cart>;

    // ✅ clear local guest after merge
    await AsyncStorage.removeItem(guestKey(mallId));

    // ✅ set server cart
    setCartFromEnvelope(res);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        count,
        isGuest,
        fetchCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
        mergeGuestCartIntoServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
