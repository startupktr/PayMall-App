/* ================= ROOT ================= */

export type RootStackParamList = {
  Splash: undefined;
  Auth: {
    redirectTo?: keyof RootStackParamList | keyof MainTabParamList;
    redirectParams?: object;
  } | undefined;
  Main: undefined;
};

/* ================= TABS ================= */

export type MainTabParamList = {
  HomeTab: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
  Scan: undefined;
};

/* ================= HOME STACK ================= */

export type HomeStackParamList = {
  Home: undefined;
  MallDetails: {
    mallId: number;
  };
};
