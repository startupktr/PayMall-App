/* ================= ROOT ================= */

export type RootStackParamList = {
  Splash: undefined;
  Auth: {
    redirectTo?: keyof RootStackParamList | keyof MainTabParamList;
    redirectParams?: object;
  } | undefined;
  Main: undefined;
  ProductDetails: undefined;
};

/* ================= TABS ================= */

export type MainTabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
  OrderTab: undefined;
  Account: undefined;
  Scan: undefined;
};

/* ================= HOME STACK ================= */

export type HomeStackParamList = {
  Home: undefined;
  MallDetails: {
    mallId: number;
  };
};
