import AsyncStorage from "@react-native-async-storage/async-storage";

export type GuestCartItem = {
  product_id: number;
  quantity: number;
  // UI helpers
  name?: string;
  price?: string;
  image?: string | null;
};

export type GuestCartPayload = {
  mall_id: number;
  items: GuestCartItem[];
  updated_at: string;
};

const KEY = "guest_cart_v1";

type GuestCartMap = Record<string, GuestCartPayload>; // mall_id -> payload

export const guestCart = {
  async getAll(): Promise<GuestCartMap> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  async get(mallId: number): Promise<GuestCartPayload | null> {
    const map = await this.getAll();
    return map[String(mallId)] ?? null;
  },

  async set(mallId: number, payload: GuestCartPayload) {
    const map = await this.getAll();
    map[String(mallId)] = payload;
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  },

  async clearMall(mallId: number) {
    const map = await this.getAll();
    delete map[String(mallId)];
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  },

  async clearAll() {
    await AsyncStorage.removeItem(KEY);
  },

  async addItem(mallId: number, item: GuestCartItem) {
    const existing = await this.get(mallId);

    const next: GuestCartPayload = existing ?? {
      mall_id: mallId,
      items: [],
      updated_at: new Date().toISOString(),
    };

    const found = next.items.find((x) => x.product_id === item.product_id);

    if (found) {
      found.quantity += item.quantity;
    } else {
      next.items.push(item);
    }

    next.updated_at = new Date().toISOString();
    await this.set(mallId, next);

    return next;
  },

  async updateQty(mallId: number, productId: number, qty: number) {
    const existing = await this.get(mallId);
    if (!existing) return null;

    if (qty <= 0) {
      existing.items = existing.items.filter((x) => x.product_id !== productId);
    } else {
      const found = existing.items.find((x) => x.product_id === productId);
      if (found) found.quantity = qty;
    }

    existing.updated_at = new Date().toISOString();

    if (existing.items.length === 0) {
      await this.clearMall(mallId);
      return null;
    }

    await this.set(mallId, existing);
    return existing;
  },

  async removeItem(mallId: number, productId: number) {
    return this.updateQty(mallId, productId, 0);
  },
};
