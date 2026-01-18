import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "post_login_redirect_v1";

export type PostLoginRedirect = {
  type: string;
  payload: {};
};

export const postLoginRedirect = {
  async set(payload: PostLoginRedirect) {
    await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  },

  async get(): Promise<PostLoginRedirect | null> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async clear() {
    await AsyncStorage.removeItem(KEY);
  },
};
