import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  User,
  Search,
  Leaf,
  Menu,
  X,
  LogOut,
  Package,
  Tag,
  Award,
  Info,
  Mail,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCard";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const trimmed = searchTerm.trim();

    if (!trimmed) return;

    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setSearchTerm("");
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-hairline">
      <div className="max-w-6xl mx-auto px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Leaf size={18} className="text-moss" strokeWidth={1.75} />
          <span className="font-display text-[18px] font-medium text-ink">
            Botaniq
          </span>
        </Link>

        {/* Centered nav */}
        <nav className="hidden md:flex items-center justify-center gap-6 text-[13.5px] font-medium text-stone">
          <Link to="/products" className="hover:text-ink transition-colors">
            Shop all
          </Link>
          <Link to="/categories" className="hover:text-ink transition-colors">
            Categories
          </Link>
          <Link to="/brands" className="hover:text-ink transition-colors">
            Brands
          </Link>
          <Link
            to="/products?sort=rating"
            className="hover:text-ink transition-colors"
          >
            Best rated
          </Link>
          <Link to="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link to="/contact" className="hover:text-ink transition-colors">
            Contact
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-1 justify-self-end">
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 rounded-lg text-stone hover:bg-paper hover:text-ink transition-colors"
              aria-label="Search"
            >
              {searchOpen ? (
                <X size={18} strokeWidth={1.75} />
              ) : (
                <Search size={18} strokeWidth={1.75} />
              )}
            </button>

            {searchOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSearchOpen(false)}
                />
                <form
                  onSubmit={handleSearchSubmit}
                  className="absolute right-0 top-11 z-20 w-64 bg-surface border border-hairline rounded-xl shadow-[0_8px_24px_rgba(33,31,27,0.1)] p-2"
                >
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
                  />
                </form>
              </>
            )}
          </div>

          <Link
            to="/cart"
            className="relative p-2 rounded-lg text-stone hover:bg-paper hover:text-ink transition-colors"
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-moss text-white text-[10px] font-medium flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="p-2 rounded-lg text-stone hover:bg-paper hover:text-ink transition-colors"
              >
                <User size={18} strokeWidth={1.75} />
              </button>

              {accountOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-52 bg-surface border border-hairline rounded-xl shadow-[0_8px_24px_rgba(33,31,27,0.1)] py-1.5">
                    <div className="px-3.5 py-2.5 border-b border-hairline">
                      <p className="text-[13px] font-medium text-ink truncate">
                        {user.name}
                      </p>
                      <p className="text-[12px] text-stone truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-paper transition-colors"
                    >
                      <Package size={15} strokeWidth={1.75} />
                      My orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-paper transition-colors"
                    >
                      <User size={15} strokeWidth={1.75} />
                      My profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] font-medium text-stone hover:bg-clay-tint hover:text-clay transition-colors"
                    >
                      <LogOut size={15} strokeWidth={1.75} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 px-4 py-2 rounded-lg bg-moss text-white text-[13px] font-medium hover:bg-moss-deep transition-colors"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-stone hover:bg-paper hover:text-ink transition-colors"
          >
            {menuOpen ? (
              <X size={18} strokeWidth={1.75} />
            ) : (
              <Menu size={18} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-hairline px-6 py-3 flex flex-col gap-1">
          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <ShoppingBag size={15} strokeWidth={1.75} />
            Shop all
          </Link>
          <Link
            to="/categories"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Tag size={15} strokeWidth={1.75} />
            Categories
          </Link>
          <Link
            to="/brands"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Award size={15} strokeWidth={1.75} />
            Brands
          </Link>
          <Link
            to="/products?sort=rating"
            onClick={() => setMenuOpen(false)}
            className="py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            Best rated
          </Link>
          <Link
            to="/about"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Info size={15} strokeWidth={1.75} />
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Mail size={15} strokeWidth={1.75} />
            Contact
          </Link>
        </nav>
      )}
    </header>
  );
}
