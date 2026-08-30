import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tag,
  Award,
  ShoppingBag,
  LogOut,
  Leaf,
  MessageSquare,
  X,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

const links = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/brands", label: "Brands", icon: Award },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "A";

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-hairline bg-surface shadow-sm transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-moss-tint">
              <Leaf size={18} className="text-moss" strokeWidth={1.75} />
            </div>

            <div>
              <span className="block font-display text-[17px] font-medium tracking-tight text-ink">
                Store Admin
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone transition-colors hover:bg-paper hover:text-ink lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">

          <div className="space-y-1.5">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-3.5 text-[13.5px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-moss text-white shadow-[0_2px_8px_rgba(63,88,67,0.15)]"
                      : "text-stone hover:bg-paper hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-stone group-hover:text-ink"
                      }`}
                    />

                    <span className="flex-1">{label}</span>

                    {isActive && (
                      <ChevronRight
                        size={14}
                        strokeWidth={1.75}
                        className="text-white/80"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-hairline p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-paper/70 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss">
              <span className="text-[13px] font-medium text-white">
                {userInitial}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {user?.name || "Administrator"}
              </p>

              <p className="truncate text-[11.5px] text-stone">
                {user?.email || "admin@example.com"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-stone transition-colors hover:bg-clay-tint hover:text-clay"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
