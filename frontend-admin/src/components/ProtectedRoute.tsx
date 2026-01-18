import React from 'react';
import { Navigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.JSX.Element;
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { loading, user, roles } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role mismatch
  if (
    allowedRoles &&
    !roles.some((role) => allowedRoles.includes(role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Allowed
  return children;
}
