import { Link } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { WishlistContext } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { lang, setLang, t, languages } = useLanguage();

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const wishlistCount = wishlist.length;
  const dashboardPath = user ? `/${user.role}` : "/login";

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <img src="/global_threads%20logo.png" alt="Global Threads" className="logo-image" />
        <span>{t("common.appName", "Global Threads")}</span>
      </Link>

      <ul className="nav-links">
        <li>
          <Link to="/">{t("nav.home", "Home")}</Link>
        </li>
        <li>
          <Link to="/shop">{t("nav.shop", "Shop")}</Link>
        </li>
        <li>
          <Link to={dashboardPath}>{t("nav.dashboard", "Dashboard")}</Link>
        </li>
        {!user && (
          <>
            <li>
              <Link to="/login">{t("nav.login", "Login")}</Link>
            </li>
            <li>
              <Link to="/signup">{t("nav.signup", "Signup")}</Link>
            </li>
          </>
        )}
        {user?.role === "buyer" && (
          <li>
            <Link to="/orders">{t("nav.orders", "Orders")}</Link>
          </li>
        )}
      </ul>

      <div className="language-select-wrap">
        <label htmlFor="global-lang">{t("common.language", "Language")}</label>
        <select
          id="global-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {languages.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 🌗 Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={t("nav.themeToggle", "Toggle theme")}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <div className="nav-right">
        {/* 🛒 Cart */}
        <Link to="/cart" className="cart-wrapper">
          🛒
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </Link>

        {/* ♥ Wishlist */}
        <Link to="/wishlist" className="wishlist-wrapper">
          ♥
          {wishlistCount > 0 && (
            <span className="wishlist-badge">{wishlistCount}</span>
          )}
        </Link>

        {/* 👤 Logged-in user */}
        {user && (
          <div className="user-box">
            <span className="user-name">
              {user.username} ({user.role})
            </span>

            <button className="logout-btn" onClick={logout}>
              {t("nav.logout", "Logout")}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;