import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">🌍 Admin Panel</h2>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/admin/dashboard"
          className={`sidebar-menu-item ${isActive("/admin/dashboard") ? "active" : ""}`}
        >
          <span className="sidebar-icon">📊</span>
          <span className="sidebar-text">Dashboard</span>
        </Link>

        <Link
          to="/admin/products"
          className={`sidebar-menu-item ${isActive("/admin/products") ? "active" : ""}`}
        >
          <span className="sidebar-icon">📦</span>
          <span className="sidebar-text">Products</span>
        </Link>

        <Link
          to="/admin/users"
          className={`sidebar-menu-item ${isActive("/admin/users") ? "active" : ""}`}
        >
          <span className="sidebar-icon">👥</span>
          <span className="sidebar-text">Users</span>
        </Link>

        <Link
          to="/admin/transactions"
          className={`sidebar-menu-item ${isActive("/admin/transactions") ? "active" : ""}`}
        >
          <span className="sidebar-icon">🧾</span>
          <span className="sidebar-text">Transactions</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link to="/" className="back-home">
          ⬅ Back to Site
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;