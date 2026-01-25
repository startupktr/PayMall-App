import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "@/types/navigation";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function getCurrentRouteName() {
  return navigationRef.getCurrentRoute()?.name;
}

export function getCurrentRouteParams() {
  return navigationRef.getCurrentRoute()?.params;
}

// ✅ Correct safe navigate helper (matches React Navigation tuple overload)
export function safeNavigate<RouteName extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[RouteName]
    ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
    : [screen: RouteName, params: RootStackParamList[RouteName]]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(...(args as any));
  }
}

export async function waitForNavigationReady(timeoutMs = 2000) {
  const start = Date.now();

  while (!navigationRef.isReady()) {
    if (Date.now() - start > timeoutMs) break;
    await new Promise((r) => setTimeout(r, 50));
  }
}
