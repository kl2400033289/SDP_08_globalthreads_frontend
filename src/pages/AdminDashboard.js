import "./AdminDashboard.css";
import { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";

import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";

function AdminDashboard() {
  const { products, setProducts } = useContext(ProductContext);
  const { orders } = useContext(OrderContext);
  const { users, removeUser, toggleBlockUser } = useContext(UserContext);
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
  });

  const [disputeForm, setDisputeForm] = useState({
    orderId: "",
    customer: "",
    issue: "",
    priority: "medium",
  });

  const [disputes, setDisputes] = useState(() => {
    const saved = localStorage.getItem("disputes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("disputes", JSON.stringify(disputes));
  }, [disputes]);

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

  const avgOrderValue = useMemo(
    () => (orders.length > 0 ? totalRevenue / orders.length : 0),
    [orders.length, totalRevenue]
  );

  const blockedUsersCount = useMemo(
    () => users.filter((entry) => entry.blocked).length,
    [users]
  );

  const highRiskTransactions = useMemo(
    () =>
      orders.filter(
        (order) =>
          Number(order.total) >= 10000 ||
          (order.items?.reduce((count, item) => count + (item.qty || 0), 0) || 0) >= 6
      ),
    [orders]
  );

  const pendingDisputes = useMemo(
    () => disputes.filter((item) => item.status !== "resolved" && item.status !== "closed"),
    [disputes]
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addProduct = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: form.name,
      price: Number(form.price),
      image: form.image || "https://via.placeholder.com/300x300?text=Product",
      rating: 0,
      reviews: [],
    };

    setProducts((prev) => [...prev, newProduct]);
    setForm({ name: "", price: "", image: "" });
    setPreview("");
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const handleDisputeField = (e) => {
    setDisputeForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createDispute = (e) => {
    e.preventDefault();

    if (!disputeForm.orderId.trim() || !disputeForm.customer.trim() || !disputeForm.issue.trim()) {
      return;
    }

    const newDispute = {
      id: Date.now(),
      orderId: disputeForm.orderId.trim(),
      customer: disputeForm.customer.trim(),
      issue: disputeForm.issue.trim(),
      priority: disputeForm.priority,
      status: "open",
      createdAt: new Date().toLocaleString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);
    setDisputeForm({
      orderId: "",
      customer: "",
      issue: "",
      priority: "medium",
    });
  };

  const updateDisputeStatus = (id, status) => {
    setDisputes((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
  };

  const clearClosedDisputes = () => {
    setDisputes((prev) => prev.filter((entry) => entry.status !== "closed"));
  };

  const forceLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    alert(t("admin.sessionCleared"));
  };

  const clearCartCache = () => {
    localStorage.removeItem("cart");
    alert(t("admin.cartCacheCleared"));
  };

  return (
<div className="admin-layout">
      <aside className="sidebar">
        <h2 className="sidebar-logo">🌍 {t("admin.sidebarTitle")}</h2>

        <ul className="sidebar-menu">
          <li
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 {t("admin.tabDashboard")}
          </li>

          <li
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            📦 {t("admin.tabProducts")}
          </li>

          <li
            className={activeTab === "accounts" ? "active" : ""}
            onClick={() => setActiveTab("accounts")}
          >
            👥 {t("admin.tabAccounts")}
          </li>

          <li
            className={activeTab === "transactions" ? "active" : ""}
            onClick={() => setActiveTab("transactions")}
          >
            🧾 {t("admin.tabTransactions")}
          </li>

          <li
            className={activeTab === "security" ? "active" : ""}
            onClick={() => setActiveTab("security")}
          >
            🔐 {t("admin.tabSecurity")}
          </li>

          <li
            className={activeTab === "disputes" ? "active" : ""}
            onClick={() => setActiveTab("disputes")}
          >
            ⚖️ {t("admin.tabDisputes")}
          </li>
        </ul>

        <Link to="/" className="back-home">
          ⬅ {t("admin.backToSite")}
        </Link>
      </aside>

      <main className="admin-main">
        {activeTab === "dashboard" && (
          <>
            <h1 className="admin-title">{t("admin.dashboardTitle")}</h1>

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
          </>
        )}

        {activeTab === "products" && (
          <>
            <h1 className="admin-title">{t("admin.productTitle")}</h1>

            <div className="admin-form-card">
              <h2>{t("admin.addNewProduct")}</h2>

              <form onSubmit={addProduct} className="admin-form">
                <input
                  type="text"
                  name="name"
                  placeholder={t("admin.productName")}
                  value={form.name}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="price"
                  placeholder={t("admin.price")}
                  value={form.price}
                  onChange={handleChange}
                />

                <input type="file" accept="image/*" onChange={handleImageUpload} />

                {preview && <img src={preview} alt="preview" className="image-preview" />}

                <button type="submit">➕ {t("admin.addProduct")}</button>
              </form>
            </div>

            <div className="admin-table">
              <h2>{t("admin.allProducts")}</h2>

              <table>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{t(`products.${product.name}`, product.name)}</td>
                      <td>₹{product.price}</td>
                      <td>
                        <button className="delete-btn" onClick={() => deleteProduct(product.id)}>
                          🗑 {t("admin.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "accounts" && (
          <div>
            <h1 className="admin-title">{t("admin.manageAccountsTitle")}</h1>

            <div className="accounts-columns">
              <section className="admin-table">
                <h2>{t("admin.artisanAccountsTitle")} ({artisans.length})</h2>
                {artisans.length === 0 ? (
                  <p className="empty-text">{t("admin.noArtisans")}</p>
                ) : (
                  <div className="users-grid">
                    {artisans.map((account) => (
                      <div key={account.id} className="user-card">
                        <h3>👤 {account.username}</h3>
                        <p>
                          <strong>{t("admin.role")}:</strong> {t("admin.artisanRole")}
                        </p>
                        <p>
                          <strong>{t("admin.status")}:</strong> {account.blocked ? `🚫 ${t("admin.blocked")}` : `✅ ${t("admin.active")}`}
                        </p>
                        <div className="user-actions">
                          <button className="block-btn" onClick={() => toggleBlockUser(account.id)}>
                            {account.blocked ? t("admin.unblock") : t("admin.block")}
                          </button>
                          <button className="delete-btn" onClick={() => removeUser(account.id)}>
                            {t("admin.delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-table">
                <h2>{t("admin.buyerAccountsTitle")} ({buyers.length})</h2>
                {buyers.length === 0 ? (
                  <p className="empty-text">{t("admin.noBuyers")}</p>
                ) : (
                  <div className="users-grid">
                    {buyers.map((account) => (
                      <div key={account.id} className="user-card">
                        <h3>👤 {account.username}</h3>
                        <p>
                          <strong>{t("admin.role")}:</strong> {t("admin.buyerRole")}
                        </p>
                        <p>
                          <strong>{t("admin.status")}:</strong> {account.blocked ? `🚫 ${t("admin.blocked")}` : `✅ ${t("admin.active")}`}
                        </p>
                        <div className="user-actions">
                          <button className="block-btn" onClick={() => toggleBlockUser(account.id)}>
                            {account.blocked ? t("admin.unblock") : t("admin.block")}
                          </button>
                          <button className="delete-btn" onClick={() => removeUser(account.id)}>
                            {t("admin.delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <h1 className="admin-title">{t("admin.monitorTransactions")}</h1>

            <div className="admin-stats">
              <div className="stat-card">
                <h3>{orders.length}</h3>
                <p>{t("admin.totalTransactions")}</p>
              </div>
              <div className="stat-card">
                <h3>₹{totalRevenue}</h3>
                <p>{t("admin.totalRevenue")}</p>
              </div>
              <div className="stat-card">
                <h3>₹{Math.round(avgOrderValue)}</h3>
                <p>{t("admin.averageTransaction")}</p>
              </div>
              <div className="stat-card">
                <h3>{highRiskTransactions.length}</h3>
                <p>{t("admin.highRiskFlagged")}</p>
              </div>
            </div>

            <div className="admin-table" style={{ marginTop: "18px" }}>
              <h2>{t("admin.recentTransactions")}</h2>
              {orders.length === 0 ? (
                <p className="empty-text">{t("admin.noTransactions")}</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{t("admin.orderId")}</th>
                      <th>{t("admin.customer")}</th>
                      <th>{t("admin.date")}</th>
                      <th>{t("admin.items")}</th>
                      <th>{t("admin.total")}</th>
                      <th>{t("admin.statusLabel")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const qty =
                        order.items?.reduce((count, item) => count + (item.qty || 0), 0) || 0;
                      const highRisk = Number(order.total) >= 10000 || qty >= 6;

                      return (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.username}</td>
                          <td>{order.date || "-"}</td>
                          <td>{qty}</td>
                          <td>₹{order.total}</td>
                          <td>
                            <span className={highRisk ? "badge danger" : "badge success"}>
                              {highRisk ? t("admin.review") : t("admin.normal")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div>
            <h1 className="admin-title">{t("admin.securityTitle")}</h1>

            <div className="admin-stats">
              <div className="stat-card">
                <h3>{blockedUsersCount}</h3>
                <p>{t("admin.blockedAccounts")}</p>
              </div>
              <div className="stat-card">
                <h3>{highRiskTransactions.length}</h3>
                <p>{t("admin.transactionsToReview")}</p>
              </div>
              <div className="stat-card">
                <h3>{localStorage.getItem("user") ? t("admin.active") : t("admin.none")}</h3>
                <p>{t("admin.currentSession")}</p>
              </div>
            </div>

            <div className="security-actions">
              <button className="block-btn" onClick={forceLogout}>
                {t("admin.forceLogout")}
              </button>
              <button className="block-btn" onClick={clearCartCache}>
                {t("admin.clearCartCache")}
              </button>
              <button className="delete-btn" onClick={clearClosedDisputes}>
                {t("admin.cleanClosedDisputes")}
              </button>
            </div>

            <div className="admin-table" style={{ marginTop: "16px" }}>
              <h2>{t("admin.flaggedQueue")}</h2>
              {highRiskTransactions.length === 0 ? (
                <p className="empty-text">{t("admin.noHighRisk")}</p>
              ) : (
                highRiskTransactions.map((order) => (
                  <div key={order.id} className="security-row">
                    <div>
                      <strong>{t("orders.order", "Order")} #{order.id}</strong>
                      <p>
                        {t("admin.user")}: {order.username} • {t("admin.total")}: ₹{order.total}
                      </p>
                    </div>
                    <span className="badge danger">{t("admin.needsReview")}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "disputes" && (
          <div>
            <h1 className="admin-title">{t("admin.handleDisputes")}</h1>

            <div className="admin-form-card">
              <h2>{t("admin.createDisputeCase")}</h2>
              <form className="admin-form" onSubmit={createDispute}>
                <input
                  type="text"
                  name="orderId"
                  placeholder={t("admin.orderId")}
                  value={disputeForm.orderId}
                  onChange={handleDisputeField}
                />
                <input
                  type="text"
                  name="customer"
                  placeholder={t("admin.customerUsername")}
                  value={disputeForm.customer}
                  onChange={handleDisputeField}
                />
                <input
                  type="text"
                  name="issue"
                  placeholder={t("admin.issueSummary")}
                  value={disputeForm.issue}
                  onChange={handleDisputeField}
                />
                <select
                  name="priority"
                  value={disputeForm.priority}
                  onChange={handleDisputeField}
                  className="admin-select"
                >
                  <option value="low">{t("admin.lowPriority")}</option>
                  <option value="medium">{t("admin.mediumPriority")}</option>
                  <option value="high">{t("admin.highPriority")}</option>
                </select>
                <button type="submit">{t("admin.createCase")}</button>
              </form>
            </div>

            <div className="admin-table">
              <h2>{t("admin.disputeQueue")} ({pendingDisputes.length} {t("admin.openSuffix")})</h2>

              {disputes.length === 0 ? (
                <p className="empty-text">{t("admin.noDisputes")}</p>
              ) : (
                disputes.map((entry) => (
                  <div key={entry.id} className="dispute-card">
                    <div className="dispute-head">
                      <strong>
                        Order #{entry.orderId} • {entry.customer}
                      </strong>
                      <span className={`badge ${entry.status === "resolved" ? "success" : "danger"}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p>{entry.issue}</p>
                    <p>
                      {t("admin.priorityLabel")}: <strong>{entry.priority}</strong> • {t("admin.createdLabel")}: {entry.createdAt}
                    </p>
                    <div className="user-actions">
                      <button className="block-btn" onClick={() => updateDisputeStatus(entry.id, "in-review")}>
                        {t("admin.inReview")}
                      </button>
                      <button className="block-btn" onClick={() => updateDisputeStatus(entry.id, "resolved")}>
                        {t("admin.resolve")}
                      </button>
                      <button className="delete-btn" onClick={() => updateDisputeStatus(entry.id, "closed")}>
                        {t("admin.close")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
