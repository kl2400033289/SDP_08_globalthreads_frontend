import { useContext, useMemo, useState } from "react";
import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import "./ArtisanDashboard.css";

const defaultImage = "https://via.placeholder.com/300x300?text=Product";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

const emptyForm = {
  name: "",
  price: "",
  sizes: [],
  productStory: "",
  description: "",
  image: "",
};

function ArtisanDashboard() {
  const { products, setProducts } = useContext(ProductContext);
  const { orders } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const { lang, setLang, t, languages } = useLanguage();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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
        </div>
      </div>
    </div>
  );
}

export default ArtisanDashboard;