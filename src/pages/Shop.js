import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import "./Shop.css";

function Shop() {
  const { products } = useContext(ProductContext);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [quantities, setQuantities] = useState({});
  const [activated, setActivated] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  // Get quantity for a product
  const getQuantity = (productId) => quantities[productId] || 0;

  // Check if product is activated
  const isActivated = (productId) => activated[productId] || false;

  const handleActivateProduct = (product) => {
    if (!user) {
      toast.error(t("shop.loginToAdd"));
      navigate("/login");
      return;
    }
    const productKey = `${product.id}`;
    const selectedSize = selectedSizes[productKey];
    
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    
    // Add 1 item to cart with size
    addToCart(product, 1, selectedSize);
    setActivated((prev) => ({
      ...prev,
      [productKey]: true,
    }));
    setQuantities((prev) => ({
      ...prev,
      [productKey]: 1,
    }));
    toast.success(t("shop.addedToCart"));
  };

  // Handle increase quantity
  const handleIncreaseQty = (product) => {
    const productKey = `${product.id}`;
    const selectedSize = selectedSizes[productKey];
    const currentQty = getQuantity(productKey);
    const newQty = currentQty + 1;
    addToCart(product, 1, selectedSize);
    setQuantities((prev) => ({
      ...prev,
      [productKey]: newQty,
    }));
  };

  // Handle decrease quantity
  const handleDecreaseQty = (product) => {
    const productKey = `${product.id}`;
    const selectedSize = selectedSizes[productKey];
    const currentQty = getQuantity(productKey);
    const newQty = currentQty - 1;
    if (newQty <= 0) {
      setQuantities((prev) => ({
        ...prev,
        [productKey]: 0,
      }));
      setActivated((prev) => ({
        ...prev,
        [productKey]: false,
      }));
    } else {
      addToCart(product, -1, selectedSize);
      setQuantities((prev) => ({
        ...prev,
        [productKey]: newQty,
      }));
    }
  };

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return a.price - b.price;
      }

      if (sortBy === "price-high") {
        return b.price - a.price;
      }

      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }

      return a.id - b.id;
    });

  return (
    <div className="shop-page">
      <h1 className="shop-title">🛍 {t("shop.title")}</h1>
      <p className="shop-subtitle">
        {t("shop.subtitle")}
      </p>

      <div className="shop-controls">
        <input
          type="text"
          placeholder={t("shop.searchPlaceholder")}
          className="shop-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="shop-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="featured">{t("shop.sortFeatured")}</option>
          <option value="price-low">{t("shop.sortPriceLow")}</option>
          <option value="price-high">{t("shop.sortPriceHigh")}</option>
          <option value="rating">{t("shop.sortRating")}</option>
        </select>
      </div>

      <p className="results-count">{filteredProducts.length} {t("shop.itemsAvailable")}</p>

      {filteredProducts.length === 0 ? (
        <p className="empty-text">{t("shop.noProducts")}</p>
      ) : (
        <div className="shop-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="shop-card"
              onClick={() => navigate(`/product/${product.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="image-wrap">
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) =>
                    (e.target.src =
                      "https://via.placeholder.com/300x300?text=Product")
                  }
                />
                <button
                  className={`heart-btn ${isInWishlist(product.id) ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                    toast.success(
                      isInWishlist(product.id)
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                    );
                  }}
                >
                  ♥
                </button>
              </div>

              <h3>{t(`products.${product.name}`, product.name)}</h3>
              <p className="price">{formatPrice(product.price)}</p>
              <p className="shop-rating">⭐ {(product.rating || 0).toFixed(1)}</p>

              <div className="size-selector" onClick={(e) => e.stopPropagation()}>
                {(product.sizes?.length ? product.sizes : sizes).map((size) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSizes[product.id] === size ? "active" : ""}`}
                    onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                {!isActivated(product.id) ? (
                  <button
                    className="add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateProduct(product);
                    }}
                  >
                    {t("shop.addToCart")}
                  </button>
                ) : (
                  <div className="qty-selector">
                    <button
                      className="qty-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecreaseQty(product);
                      }}
                    >
                      −
                    </button>
                    <span className="qty-display">{getQuantity(product.id)}</span>
                    <button
                      className="qty-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIncreaseQty(product);
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Shop;