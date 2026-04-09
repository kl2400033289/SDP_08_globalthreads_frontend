import "./AdminDashboard.css";
import { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";

import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import {
  createProduct,
  updateProduct,
  deleteProduct as deleteProductApi,
} from "../api";
import toast from "react-hot-toast";

function AdminDashboard() {
  const { products, setProducts } = useContext(ProductContext);
  const { orders } = useContext(OrderContext);
  const { users, removeUser, toggleBlockUser } = useContext(UserContext);
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [preview, setPreview] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    costPrice: "",
    category: "women",
    rating: "",
    color: "",
    sizes: "",
    description: "",
    productStory: "",
    imageUrl: "",
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

  const addProduct = async (e) => {
    e.preventDefault();
    const resolvedImage = form.image || form.imageUrl;

    if (!form.name || !form.price || !resolvedImage) {
      toast.error("Please enter name, price, and image (upload or URL).");
      return;
    }

    const duplicateImage = products.some((product) => product.image === resolvedImage);

    if (duplicateImage) {
      toast("This image is already in the database. Importing another copy.");
    }

    const productPayload = {
      name: form.name,
      title: form.name,
      price: Number(form.price),
      costPrice: form.costPrice === "" ? null : Number(form.costPrice),
      category: form.category || "general",
      image: resolvedImage,
      imageUrl: resolvedImage,
      rating: form.rating === "" ? 0 : Number(form.rating),
      color: form.color,
      sizes: form.sizes
        ? form.sizes
            .split(",")
            .map((size) => size.trim())
            .filter(Boolean)
        : [],
      description: form.description,
      productStory: form.productStory,
      reviews: [],
    };

    try {
      if (editingProductId) {
        const updatedProduct = await updateProduct(editingProductId, {
          ...productPayload,
          image: resolvedImage,
        });

        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProductId
              ? { ...product, ...(updatedProduct || productPayload), id: editingProductId }
              : product
          )
        );
        toast.success("Product updated successfully.");
      } else {
        const newProduct = {
          id: Date.now(),
          ...productPayload,
          image: resolvedImage,
        };
        const savedProduct = await createProduct(newProduct);
        setProducts((prev) => [...prev, savedProduct || newProduct]);
        toast.success("Product imported into the database.");
      }

      setForm({
        name: "",
        price: "",
        costPrice: "",
        category: "women",
        rating: "",
        color: "",
        sizes: "",
        description: "",
        productStory: "",
        imageUrl: "",
        image: "",
      });
      setPreview("");
      setEditingProductId(null);
    } catch (error) {
      toast.error(error?.message || "Failed to save product.");
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      costPrice: product.costPrice == null ? "" : String(product.costPrice),
      category: product.category || "general",
      rating: product.rating == null ? "" : String(product.rating),
      color: product.color || "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
      description: product.description || "",
      productStory: product.productStory || "",
      imageUrl: product.imageUrl || product.image || "",
      image: product.image || "",
    });
    setPreview(product.imageUrl || product.image || "");
  };

  const resetProductForm = () => {
    setForm({
      name: "",
      price: "",
      costPrice: "",
      category: "women",
      rating: "",
      color: "",
      sizes: "",
      description: "",
      productStory: "",
      imageUrl: "",
      image: "",
    });
    setPreview("");
    setEditingProductId(null);
  };

  const deleteProduct = async (id) => {
    try {
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success("Product deleted successfully.");
    } catch (error) {
      toast.error(error?.message || "Failed to delete product.");
    }
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
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    alert(t("admin.sessionCleared"));
  };

  const clearCartCache = () => {
    localStorage.removeItem("cart");
    alert(t("admin.cartCacheCleared"));
  };

  return (
    <div className="admin-layout admin-light">
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

                <input
                  type="number"
                  name="costPrice"
                  placeholder="Cost Price"
                  value={form.costPrice}
                  onChange={handleChange}
                />

                <select
                  name="category"
                  className="admin-select"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="general">General</option>
                </select>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating"
                  placeholder="Rating (0 to 5)"
                  value={form.rating}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="color"
                  placeholder="Color"
                  value={form.color}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="sizes"
                  placeholder="Sizes (comma-separated, e.g. S, M, L, XL)"
                  value={form.sizes}
                  onChange={handleChange}
                />

                <textarea
                  name="description"
                  placeholder="Product description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />

                <textarea
                  name="productStory"
                  placeholder="Product story"
                  value={form.productStory}
                  onChange={handleChange}
                  rows={3}
                />

                <input
                  type="url"
                  name="imageUrl"
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={(e) => {
                    handleChange(e);
                    setPreview(e.target.value);
                  }}
                />

                <input type="file" accept="image/*" onChange={handleImageUpload} />

                {preview && <img src={preview} alt="preview" className="image-preview" />}

                <button type="submit">
                  {editingProductId ? `✏️ ${t("update", "Update")}` : `➕ ${t("admin.addProduct")}`}
                </button>
                {editingProductId && (
                  <button type="button" className="delete-btn" onClick={resetProductForm}>
                    {t("common.cancel", "Cancel")}
                  </button>
                )}
              </form>
            </div>

            <div className="admin-table">
              <h2>{t("admin.allProducts")}</h2>

              <table>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>₹{product.price}</td>
                      <td>{product.category || "general"}</td>
                      <td>
                        {product.costPrice == null ? "-" : `₹${product.costPrice}`}
                      </td>
                      <td>
                        <button className="block-btn" onClick={() => editProduct(product)}>
                          ✏️ {t("common.edit", "Edit")}
                        </button>
                      </td>
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
                <h2>Artisan Accounts ({artisans.length})</h2>
                {artisans.length === 0 ? (
                  <p className="empty-text">{t("admin.noArtisans")}</p>
                ) : (
                  <div className="users-grid">
                    {artisans.map((account) => (
                      <div key={account.id} className="user-card">
                        <h3>👤 {account.username}</h3>
                        <p>
                          <strong>{t("admin.role")}:</strong> artisan
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
                <h2>Buyer Accounts ({buyers.length})</h2>
                {buyers.length === 0 ? (
                  <p className="empty-text">{t("admin.noBuyers")}</p>
                ) : (
                  <div className="users-grid">
                    {buyers.map((account) => (
                      <div key={account.id} className="user-card">
                        <h3>👤 {account.username}</h3>
                        <p>
                          <strong>{t("admin.role")}:</strong> buyer
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
