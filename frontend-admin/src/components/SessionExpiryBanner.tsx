import { useEffect, useState } from "react";
import { getTokenExpiry } from "@/utils/jwt";
import { useAuth } from "@/context/AuthContext";

export default function SessionExpiryBanner() {
  const { signOut } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const check = () => {
      const remaining = expiry - Date.now();

      if (remaining <= 0) {
        signOut();
      } else if (remaining <= 2 * 60 * 1000) {
        setShow(true);
      }
    };

    check();
    const interval = setInterval(check, 10000);

    return () => clearInterval(interval);
  }, [signOut]);

  if (!show) return null;

  return (
    <div className="fixed top-0 inset-x-0 bg-yellow-500 text-black text-center py-2 z-50">
      Your session will expire soon. Please save your work.
    </div>
  );
}
