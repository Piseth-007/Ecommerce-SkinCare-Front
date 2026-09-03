import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
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
  Sun,
  Moon,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCard";
import { FavoritesContext } from "../../context/FavoriteContext";
import api from "../../api/axios";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: favoriteCount } = useContext(FavoritesContext);

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [openMenu, setOpenMenu] = useState(null);

  const closeTimer = useRef(null);


  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // --------------------------------------------------
  // Fetch categories + brands
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const fetchNavbarData = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          api.get("/categories"),
          api.get("/brands"),
        ]);

        if (!mounted) return;

        const categoryData = Array.isArray(categoriesResponse.data?.data)
          ? categoriesResponse.data.data
          : Array.isArray(categoriesResponse.data)
            ? categoriesResponse.data
            : [];

        const brandData = Array.isArray(brandsResponse.data?.data)
          ? brandsResponse.data.data
          : Array.isArray(brandsResponse.data)
            ? brandsResponse.data
            : [];

        setCategories(categoryData);
        setBrands(brandData);
      } catch (error) {
        if (!mounted) return;

        console.error("Failed to load navbar data:", error);

        setCategories([]);
        setBrands([]);
      }
    };

    fetchNavbarData();

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------------------------
  // Cleanup dropdown timer
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      clearTimeout(closeTimer.current);
    };
  }, []);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAccountOpen(false);
      setMenuOpen(false);
      navigate("/");
    }
  };

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const trimmed = searchTerm.trim();

    if (!trimmed) return;

    navigate(`/products?search=${encodeURIComponent(trimmed)}`);

    setSearchOpen(false);
    setSearchTerm("");
  };

  // --------------------------------------------------
  // Dropdown
  // --------------------------------------------------

  const openDropdown = (key) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimer.current);

    closeTimer.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  // --------------------------------------------------
  // Close mobile menu
  // --------------------------------------------------

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-hairline">
      <style>{`
        @keyframes navdrop-in {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes navmenu-in {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes navbadge-pop {
          0% {
            transform: scale(.55);
            opacity: 0;
          }

          70% {
            transform: scale(1.12);
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .navdrop-in {
          animation: navdrop-in .18s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .navmenu-in {
          animation: navmenu-in .3s cubic-bezier(.22, 1, .36, 1) both;
        }

        .nav-action {
          transition:
            transform .2s cubic-bezier(.22, 1, .36, 1),
            color .2s ease,
            background-color .2s ease,
            border-color .2s ease;
        }

        .nav-action:hover {
          transform: translateY(-1px);
        }

        .nav-action:active {
          transform: translateY(0) scale(.94);
        }

        .nav-link {
          position: relative;
          transition: color .2s ease;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -6px;
          height: 1.5px;
          border-radius: 999px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: center;
          transition:
            transform .24s cubic-bezier(.22, 1, .36, 1);
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .nav-cart-badge {
          animation: navbadge-pop .32s
            cubic-bezier(.22, 1, .36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .navdrop-in,
          .navmenu-in,
          .nav-cart-badge {
            animation: none !important;
          }

          .nav-action,
          .nav-link::after {
            transition: none !important;
          }
        }
      `}</style>

      {/* ==================================================
          DESKTOP / TOP BAR
      ================================================== */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
        {/* Logo */}

        <Link
          to="/"
          className="nav-action flex items-center gap-2 shrink-0"
          aria-label="Botaniq home"
        >
          <Leaf size={18} className="text-moss" strokeWidth={1.75} />

          <span className="font-display text-[18px] font-medium text-ink">
            Botaniq
          </span>
        </Link>

        {/* Desktop navigation */}

        <nav className="hidden md:flex items-center justify-center gap-5 lg:gap-6 text-[13.5px] font-medium text-stone">
          {/* Shop */}

          <Link to="/products" className="nav-link hover:text-ink">
            Shop all
          </Link>

          {/* Categories */}

          <div
            className="relative"
            onMouseEnter={() => openDropdown("categories")}
            onMouseLeave={scheduleClose}
          >
            <Link
              to="/categories"
              className={`nav-link flex items-center gap-1 ${
                openMenu === "categories" ? "text-ink" : "hover:text-ink"
              }`}
            >
              Categories
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={`transition-transform duration-200 ${
                  openMenu === "categories" ? "rotate-180" : ""
                }`}
              />
            </Link>

            {openMenu === "categories" && (
              <NavDropdown
                items={categories}
                emptyLabel="No categories yet"
                buildHref={(item) => `/products?category_id=${item.id}`}
                viewAllHref="/categories"
                viewAllLabel="View all categories"
                onNavigate={() => setOpenMenu(null)}
              />
            )}
          </div>

          {/* Brands */}

          <div
            className="relative"
            onMouseEnter={() => openDropdown("brands")}
            onMouseLeave={scheduleClose}
          >
            <Link
              to="/brands"
              className={`nav-link flex items-center gap-1 ${
                openMenu === "brands" ? "text-ink" : "hover:text-ink"
              }`}
            >
              Brands
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={`transition-transform duration-200 ${
                  openMenu === "brands" ? "rotate-180" : ""
                }`}
              />
            </Link>

            {openMenu === "brands" && (
              <NavDropdown
                items={brands}
                emptyLabel="No brands yet"
                buildHref={(item) => `/products?brand_id=${item.id}`}
                viewAllHref="/brands"
                viewAllLabel="View all brands"
                onNavigate={() => setOpenMenu(null)}
                showLogo
              />
            )}
          </div>
          <Link to="/products?sort=rating" className="nav-link hover:text-ink">
            Best rated
          </Link>

          {/* About */}

          <Link to="/about" className="nav-link hover:text-ink">
            About
          </Link>

          {/* Contact */}

          <Link to="/contact" className="nav-link hover:text-ink">
            Contact
          </Link>
        </nav>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div className="flex items-center gap-0.5 sm:gap-1 justify-self-end">
          {/* Dark mode */}

          <button
            type="button"
            onClick={toggleDarkMode}
            className="nav-action flex h-9 w-9 items-center justify-center rounded-lg text-stone hover:bg-paper hover:text-ink"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? (
              <Sun size={17} strokeWidth={1.75} />
            ) : (
              <Moon size={17} strokeWidth={1.75} />
            )}
          </button>

          {/* Search */}

          <div className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="nav-action p-2 rounded-lg text-stone hover:bg-paper hover:text-ink"
              aria-label={searchOpen ? "Close search" : "Search"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? (
                <X size={18} strokeWidth={1.75} />
              ) : (
                <Search size={18} strokeWidth={1.75} />
              )}
            </button>

            {searchOpen && (
              <>
                {/* Search backdrop */}

                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSearchOpen(false)}
                  aria-hidden="true"
                />

                {/* Search form */}

                <form
                  onSubmit={handleSearchSubmit}
                  className="navdrop-in absolute right-0 top-11 z-20 w-64 bg-surface border border-hairline rounded-xl shadow-[0_8px_24px_rgba(33,31,27,0.1)] p-2"
                >
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone"
                    />

                    <input
                      autoFocus
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-hairline bg-paper text-[13px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
                      aria-label="Search products"
                    />
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Cart */}

          <Link
            to="/cart"
            className="nav-action relative p-2 rounded-lg text-stone hover:bg-paper hover:text-ink"
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          >
            <ShoppingBag size={18} strokeWidth={1.75} />

            {itemCount > 0 && (
              <span
                key={itemCount}
                className="nav-cart-badge absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-moss text-white text-[10px] font-medium flex items-center justify-center"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {/* Favorites */}

          <Link
            to="/favorites"
            className="nav-action relative p-2 rounded-lg text-stone hover:bg-paper hover:text-ink"
            aria-label={`Favorites${
              favoriteCount > 0 ? `, ${favoriteCount} items` : ""
            }`}
          >
            <Heart size={18} strokeWidth={1.75} />

            {favoriteCount > 0 && (
              <span
                key={favoriteCount}
                className="nav-cart-badge absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-clay text-white text-[10px] font-medium flex items-center justify-center"
              >
                {favoriteCount > 99 ? "99+" : favoriteCount}
              </span>
            )}
          </Link>

          {/* Account */}

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="nav-action p-2 rounded-lg text-stone hover:bg-paper hover:text-ink"
                aria-label="Account menu"
                aria-expanded={accountOpen}
              >
                <User size={18} strokeWidth={1.75} />
              </button>

              {accountOpen && (
                <>
                  {/* Account backdrop */}

                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAccountOpen(false)}
                    aria-hidden="true"
                  />

                  {/* Account dropdown */}

                  <div className="navdrop-in absolute right-0 top-11 z-20 w-52 bg-surface border border-hairline rounded-xl shadow-[0_8px_24px_rgba(33,31,27,0.1)] py-1.5">
                    {/* User info */}

                    <div className="px-3.5 py-2.5 border-b border-hairline">
                      <p className="text-[13px] font-medium text-ink truncate">
                        {user.name || "User"}
                      </p>

                      <p className="text-[12px] text-stone truncate">
                        {user.email || ""}
                      </p>
                    </div>

                    {/* Orders */}

                    <Link
                      to="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-paper transition-colors"
                    >
                      <Package size={15} strokeWidth={1.75} />
                      My orders
                    </Link>

                    {/* Profile */}

                    <Link
                      to="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-paper transition-colors"
                    >
                      <User size={15} strokeWidth={1.75} />
                      My profile
                    </Link>

                    {/* Logout */}

                    <button
                      type="button"
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
              className="nav-action ml-1 px-3 sm:px-4 py-2 rounded-lg bg-moss text-white text-[13px] font-medium hover:bg-moss-deep"
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu button */}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="nav-action md:hidden p-2 rounded-lg text-stone hover:bg-paper hover:text-ink"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={18} strokeWidth={1.75} />
            ) : (
              <Menu size={18} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* ==================================================
          MOBILE MENU
      ================================================== */}

      {menuOpen && (
        <nav
          className="navmenu-in md:hidden border-t border-hairline px-6 py-3 flex flex-col gap-1"
          aria-label="Mobile navigation"
        >
          {/* Shop */}

          <Link
            to="/products"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <ShoppingBag size={15} strokeWidth={1.75} />
            Shop all
          </Link>

          {/* Categories */}

          <Link
            to="/categories"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Tag size={15} strokeWidth={1.75} />
            Categories
          </Link>

          {/* Brands */}

          <Link
            to="/brands"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Award size={15} strokeWidth={1.75} />
            Brands
          </Link>

          {/* Favorites */}

          <Link
            to="/favorites"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Heart size={15} strokeWidth={1.75} />
            Favorites
            {favoriteCount > 0 && (
              <span className="ml-auto rounded-full bg-clay px-1.5 py-0.5 text-[10px] font-medium text-white">
                {favoriteCount > 99 ? "99+" : favoriteCount}
              </span>
            )}
          </Link>

          {/* Best rated */}

          <Link
            to="/products?sort=rating"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Award size={15} strokeWidth={1.75} />
            Best rated
          </Link>

          {/* About */}

          <Link
            to="/about"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Info size={15} strokeWidth={1.75} />
            About
          </Link>

          {/* Contact */}

          <Link
            to="/contact"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
          >
            <Mail size={15} strokeWidth={1.75} />
            Contact
          </Link>

          {/* Mobile account actions */}

          {user && (
            <div className="mt-2 pt-2 border-t border-hairline">
              <Link
                to="/orders"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
              >
                <Package size={15} strokeWidth={1.75} />
                My orders
              </Link>

              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 py-2 text-[13.5px] font-medium text-stone hover:text-ink"
              >
                <User size={15} strokeWidth={1.75} />
                My profile
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full py-2 text-[13.5px] font-medium text-stone hover:text-clay"
              >
                <LogOut size={15} strokeWidth={1.75} />
                Log out
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

// ======================================================
// NAV DROPDOWN
// ======================================================

function NavDropdown({
  items,
  emptyLabel,
  buildHref,
  viewAllHref,
  viewAllLabel,
  onNavigate,
  showLogo = false,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div
      className="navdrop-in absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-hairline bg-surface shadow-[0_16px_40px_rgba(33,31,27,0.12)]"
      style={{
        transformOrigin: "top center",
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="max-h-80 overflow-y-auto p-1.5">
        {safeItems.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12.5px] text-stone">
            {emptyLabel}
          </p>
        ) : (
          safeItems.map((item) => (
            <Link
              key={item.id}
              to={buildHref(item)}
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium capitalize text-ink transition-colors hover:bg-paper hover:text-moss"
            >
              {showLogo && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-paper">
                  {item.logo_url ? (
                    <img
                      src={item.logo_url}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold text-moss">
                      {item.name?.charAt(0).toUpperCase() || "B"}
                    </span>
                  )}
                </span>
              )}

              <span className="truncate">{item.name}</span>
            </Link>
          ))
        )}
      </div>

      {safeItems.length > 0 && (
        <Link
          to={viewAllHref}
          onClick={onNavigate}
          className="flex items-center justify-between gap-2 rounded-b-xl border-t border-hairline bg-paper/50 px-3.5 py-2.5 text-[12px] font-medium text-moss transition-colors hover:bg-moss-tint"
        >
          {viewAllLabel}

          <ArrowRight size={13} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
