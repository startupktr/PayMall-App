import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "@/types/navigation";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function getCurrentRouteName() {
  return navigationRef.getCurrentRoute()?.name;
}

export function getCurrentRouteParams() {
  return navigationRef.getCurrentRoute()?.params;
}
