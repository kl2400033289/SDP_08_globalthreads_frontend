import "./AdminDashboard.css";
import { useMemo, useContext } from "react";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";

function AdminDashboard() {
  const { orders } = useContext(OrderContext);
  const { users } = useContext(UserContext);
  const { t } = useLanguage();

  const buyers = useMemo(
    () => users.filter((entry) => entry.role === "buyer"),
    [users]
  );

  const artisans = useMemo(
    () => users.filter((entry) => entry.role === "artisan"),
    [users]
  );

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total || 0), 0),
    [orders]
  );

  const pendingDisputes = useMemo(() => {
    const saved = localStorage.getItem("disputes");
    const disputes = saved ? JSON.parse(saved) : [];
    return disputes.filter((item) => item.status !== "resolved" && item.status !== "closed");
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>{t("admin.totalAccounts")}</p>
        </div>

        <div className="stat-card">
          <h3>{buyers.length}</h3>
          <p>{t("admin.buyerAccounts")}</p>
        </div>

        <div className="stat-card">
          <h3>{artisans.length}</h3>
          <p>{t("admin.artisanAccounts")}</p>
        </div>

        <div className="stat-card">
          <h3>{orders.length}</h3>
          <p>{t("admin.totalTransactions")}</p>
        </div>

        <div className="stat-card">
          <h3>₹{totalRevenue}</h3>
          <p>{t("admin.revenue")}</p>
        </div>

        <div className="stat-card">
          <h3>{pendingDisputes.length}</h3>
          <p>{t("admin.openDisputes")}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
