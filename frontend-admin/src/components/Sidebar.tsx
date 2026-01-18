import { SIDEBAR_ITEMS } from "@/config/sidebar";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const { roles } = useAuth();

  const visibleItems = SIDEBAR_ITEMS.filter((item) =>
    item.roles.some((role) => roles.includes(role))
  );

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

      <nav className="space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-gray-700" : "hover:bg-gray-800"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
