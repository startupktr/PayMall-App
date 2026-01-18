import { type AppRole } from "@/context/AuthContext";

export const hasRole = (
  roles: AppRole[],
  allowed: AppRole[]
): boolean => {
  return roles.some((role) => allowed.includes(role));
};
