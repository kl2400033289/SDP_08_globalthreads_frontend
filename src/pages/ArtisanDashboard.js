import { useContext, useEffect, useMemo, useState } from "react";
import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { loadCustomizationRequests, STORAGE_KEY } from "../utils/customizationRequests";
import "./ArtisanDashboard.css";

const defaultImage = "https://via.placeholder.com/300x300?text=Product";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

const trackingSteps = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const getStepDate = (order, step) => {
  const entry = [...(order.trackingTimeline || [])]
    .reverse()
    .find((item) => item.status === step);

  if (!entry?.at) {
    return "";
  }

  return entry.at.split(",")[0];
};

const emptyForm = {
  name: "",
  price: "",
  stock: "",
  sizes: [],
  productStory: "",
  description: "",
  image: "",
};

function ArtisanDashboard() {
  const { products, setProducts } = useContext(ProductContext);
  const { orders, updateOrderTracking } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const { lang, setLang, t, languages } = useLanguage();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [customRequests, setCustomRequests] = useState(() => loadCustomizationRequests());

  const trackingLabel = {
    placed: t("tracking.placed", "Order Placed"),
    confirmed: t("tracking.confirmed", "Confirmed"),
    processing: t("tracking.processing", "Processing"),
    shipped: t("tracking.shipped", "Shipped"),
    out_for_delivery: t("tracking.outForDelivery", "Out for Delivery"),
    delivered: t("tracking.delivered", "Delivered"),
  };

  const currentArtisan = user?.username?.trim().toLowerCase();

  const artisanProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (product.artisan || "artisan").trim().toLowerCase() ===
          currentArtisan
      ),
    [products, currentArtisan]
  );

  const artisanRequests = useMemo(
    () =>
      customRequests.filter(
        (request) =>
          (request.artisan || "artisan").trim().toLowerCase() === currentArtisan
      ),
    [customRequests, currentArtisan]
  );

  const artisanOrderEntries = useMemo(() => {
    const artisanProductIds = new Set(artisanProducts.map((product) => product.id));

    return orders
      .map((order) => {
        const artisanItems = order.items.filter((item) => artisanProductIds.has(item.id));
        return {
          ...order,
          artisanItems,
        };
      })
      .filter((order) => order.artisanItems.length > 0);
  }, [orders, artisanProducts]);

  useEffect(() => {
    const syncRequests = () => setCustomRequests(loadCustomizationRequests());

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        syncRequests();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const analytics = useMemo(() => {
    const artisanIds = new Set(artisanProducts.map((product) => product.id));
    const soldByProduct = {};
    const customers = new Set();
    let soldUnits = 0;
    let revenue = 0;
    let cost = 0;

    orders.forEach((order) => {
      let purchasedFromArtisan = false;

      order.items.forEach((item) => {
        if (!artisanIds.has(item.id)) {
          return;
        }

        const qty = Number(item.qty) || 1;
        const lineRevenue = (Number(item.price) || 0) * qty;
        const sourceProduct = artisanProducts.find(
          (product) => product.id === item.id
        );
        const unitCost = Number(sourceProduct?.costPrice) || 0;

        soldByProduct[item.id] = (soldByProduct[item.id] || 0) + qty;
        soldUnits += qty;
        revenue += lineRevenue;
        cost += unitCost * qty;
        purchasedFromArtisan = true;
      });

      if (purchasedFromArtisan && order.username) {
        customers.add(order.username);
      }
    });

    return {
      soldByProduct,
      soldUnits,
      revenue,
      customersCount: customers.size,
      profitLoss: revenue - cost,
    };
  }, [orders, artisanProducts]);

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const handleFieldChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSizeToggle = (size) => {
    setForm((prev) => {
      const hasSize = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: hasSize
          ? prev.sizes.filter((item) => item !== size)
          : [...prev.sizes, size],
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.price) {
      return;
    }

    if (editingId) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingId
            ? {
                ...product,
                name: form.name.trim(),
                price: Number(form.price) || 0,
                stock: Number(form.stock) || 0,
                sizes: form.sizes,
                productStory: form.productStory.trim(),
                description: form.description.trim(),
                image: form.image || product.image,
              }
            : product
        )
      );

      resetForm();
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: form.name.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      sizes: form.sizes,
      productStory: form.productStory.trim(),
      description: form.description.trim(),
      image: form.image || defaultImage,
      rating: 0,
      reviews: [],
      artisan: user?.username || "artisan",
    };

    setProducts((prev) => [newProduct, ...prev]);
    resetForm();
  };

  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      sizes: product.sizes || [],
      productStory: product.productStory || "",
      description: product.description || "",
      image: product.image || "",
    });
  };

  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const handleTrackingChange = (orderId, status) => {
    updateOrderTracking(orderId, status, user?.username || "artisan");
  };

  return (
    <div className="artisan-page">
      <div className="artisan-header-row">
        <div>
          <h1>{t("artisanTitle", "Artisan Dashboard")}</h1>
          <p>{t("artisanSubtitle", "Upload products, update price and stock, and view your sales performance.")}</p>
        </div>

        <div className="artisan-language">
          <label htmlFor="artisan-lang">{t("common.language", "Language")}</label>
          <select
            id="artisan-lang"
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
      </div>

      <div className="artisan-stats">
        <div className="artisan-stat-card">
          <h3>{artisanProducts.length}</h3>
          <p>{t("productsCount", "Products")}</p>
        </div>
        <div className="artisan-stat-card">
          <h3>{analytics.soldUnits}</h3>
          <p>{t("soldUnits", "Sold Units")}</p>
        </div>
        <div className="artisan-stat-card">
          <h3>{analytics.customersCount}</h3>
          <p>{t("customersCount", "Customers")}</p>
        </div>
        <div className="artisan-stat-card">
          <h3>{formatMoney(analytics.revenue)}</h3>
          <p>{t("revenue", "Revenue")}</p>
        </div>
        <div className="artisan-stat-card">
          <h3
            className={
              analytics.profitLoss >= 0
                ? "artisan-value-positive"
                : "artisan-value-negative"
            }
          >
            {formatMoney(analytics.profitLoss)}
          </h3>
          <p>{t("profitLoss", "Profit / Loss")}</p>
        </div>
      </div>

      <div className="artisan-grid">
        <div className="artisan-form-card">
          <h2>{t("uploadProduct", "Upload Product")}</h2>

          <form className="artisan-form" onSubmit={handleSaveProduct}>
            <label htmlFor="name">{t("productName", "Product Name")}</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="price">{t("productPrice", "Product Cost")}</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="stock">{t("productStock", "Stock")}</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleFieldChange}
              required
            />

            <label>{t("productSizes", "Product Sizes")}</label>
            <div className="size-checkbox-grid">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`size-option ${form.sizes.includes(size) ? "selected" : ""}`}
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            <label htmlFor="productStory">{t("productStory", "Story")}</label>
            <textarea
              id="productStory"
              name="productStory"
              rows="3"
              value={form.productStory}
              onChange={handleFieldChange}
            />

            <label htmlFor="description">{t("productDescription", "Product Description")}</label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={form.description}
              onChange={handleFieldChange}
            />

            <label htmlFor="image">{t("productImage", "Upload Product Image")}</label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {form.image && (
              <img src={form.image} alt="preview" className="artisan-preview" />
            )}

            <div className="artisan-form-actions">
              <button type="submit" className="artisan-primary-btn">
                {editingId ? t("update", "Update") : t("addProduct", "Add Product")}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="artisan-secondary-btn"
                  onClick={resetForm}
                >
                  {t("common.cancel", "Cancel")}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="artisan-products-card">
          <h2>{t("yourProducts", "Your Products")}</h2>

          {artisanProducts.length === 0 ? (
            <p className="artisan-empty">{t("noProducts", "No products yet. Add your first product.")}</p>
          ) : (
            <div className="artisan-product-list">
              {artisanProducts.map((product) => (
                <div key={product.id} className="artisan-product-item">
                  <img
                    src={product.image || defaultImage}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = defaultImage;
                    }}
                  />

                  <div className="artisan-product-info">
                    <h3>{t(`products.${product.name}`, product.name)}</h3>
                    <p>
                      {t("productPrice", "Product Cost")} : {formatMoney(product.price)}
                    </p>
                    <p>
                      {t("productStock", "Stock")} : {Number(product.stock) || 0}
                    </p>
                    {product.sizes?.length > 0 && (
                      <p>
                        {t("sizesLabel", "Sizes")} : {product.sizes.join(", ")}
                      </p>
                    )}
                    {product.productStory && (
                      <p className="artisan-product-story">
                        {t("storyLabel", "Story")}: {product.productStory}
                      </p>
                    )}
                    {product.description && (
                      <p className="artisan-product-description">
                        {product.description}
                      </p>
                    )}
                    <p>
                      {t("soldByProduct", "Units Sold")} : {analytics.soldByProduct[product.id] || 0}
                    </p>
                  </div>

                  <div className="artisan-product-actions">
                    <button
                      className="artisan-secondary-btn"
                      type="button"
                      onClick={() => handleEditProduct(product)}
                    >
                      {t("common.edit", "Edit")}
                    </button>
                    <button
                      className="artisan-danger-btn"
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="artisan-request-section">
            <h3>{t("customizationRequests", "Customization Requests")}</h3>

            {artisanRequests.length === 0 ? (
              <p className="artisan-empty">
                {t("noCustomizationRequests", "No customization requests yet.")}
              </p>
            ) : (
              <div className="artisan-request-list">
                {artisanRequests.map((request) => (
                  <div key={request.id} className="artisan-request-item">
                    <div>
                      <h4>{request.productName}</h4>
                      <p>
                        <strong>{t("buyer.customer", "Customer")}</strong>: {request.buyer}
                      </p>
                      <p>
                        <strong>{t("common.message", "Message")}</strong>: {request.message}
                      </p>
                    </div>

                    <div className="artisan-request-meta">
                      <span>{request.createdAt}</span>
                      <span className="artisan-request-badge">{request.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="artisan-request-section">
            <h3>{t("artisan.trackOrders", "Track Orders")}</h3>

            {artisanOrderEntries.length === 0 ? (
              <p className="artisan-empty">{t("artisan.noOrdersToTrack", "No orders to track yet.")}</p>
            ) : (
              <div className="artisan-order-list">
                {artisanOrderEntries.map((order) => (
                  <div key={order.id} className="artisan-order-item">
                    <div>
                      <h4>
                        {t("orders.order", "Order")} #{order.id}
                      </h4>
                      <p>
                        <strong>{t("admin.customer", "Customer")}</strong>: {order.username}
                      </p>
                      <p>
                        <strong>{t("orders.total", "Total")}</strong>: ₹{order.total}
                      </p>
                      <p>
                        <strong>{t("artisan.itemsFulfilling", "Items you are fulfilling")}:</strong> {order.artisanItems.map((item) => item.name).join(", ")}
                      </p>
                    </div>

                    <div className="artisan-order-controls">
                      <label htmlFor={`status-${order.id}`}>{t("admin.statusLabel", "Status")}</label>
                      <select
                        id={`status-${order.id}`}
                        value={order.trackingStatus || "placed"}
                        onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                      >
                        <option value="placed">{t("tracking.placed", "Order Placed")}</option>
                        <option value="confirmed">{t("tracking.confirmed", "Confirmed")}</option>
                        <option value="processing">{t("tracking.processing", "Processing")}</option>
                        <option value="shipped">{t("tracking.shipped", "Shipped")}</option>
                        <option value="out_for_delivery">{t("tracking.outForDelivery", "Out for Delivery")}</option>
                        <option value="delivered">{t("tracking.delivered", "Delivered")}</option>
                      </select>
                      <span className="artisan-request-badge">
                        {trackingLabel[order.trackingStatus || "placed"]}
                      </span>
                    </div>

                    <div className="artisan-tracking-steps">
                      {trackingSteps.map((step) => {
                        const activeIndex = trackingSteps.indexOf(order.trackingStatus || "placed");
                        const stepIndex = trackingSteps.indexOf(step);
                        const isDone = stepIndex < activeIndex;
                        const isCurrent = stepIndex === activeIndex;

                        return (
                          <div
                            key={`${order.id}-${step}`}
                            className={`artisan-tracking-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}
                          >
                            <span className="artisan-tracking-dot" />
                            <span className="artisan-tracking-label">{trackingLabel[step]}</span>
                            <span className="artisan-tracking-date">{getStepDate(order, step) || "-"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtisanDashboard;