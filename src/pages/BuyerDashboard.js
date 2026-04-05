import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import "./BuyerDashboard.css";

function BuyerDashboard() {
  const { products, setProducts } = useContext(ProductContext);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [reviewProductId, setReviewProductId] = useState(null);
  const [rating, setRating] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("top-rated");
  const [quantities, setQuantities] = useState({});
  const [activated, setActivated] = useState({});

  const [comment, setComment] = useState("");
  const [customProduct, setCustomProduct] = useState(null);
  const [customMsg, setCustomMsg] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

  // Get quantity for a product
  const getQuantity = (productId) => quantities[productId] || 0;

  // Check if product is activated
  const isActivated = (productId) => activated[productId] || false;

  // Activate and add first item to cart
  const activateProduct = (productId, product) => {
    const selectedSize = selectedSizes[productId];
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    setActivated((prev) => ({
      ...prev,
      [productId]: true,
    }));
    setQuantities((prev) => ({
      ...prev,
      [productId]: 1,
    }));
    addToCart(product, 1, selectedSize);
    toast.success(t("buyer.addedToCart"));
  };

  // Handle increase quantity and add to cart
  const handleIncreaseQty = (product) => {
    const currentQty = getQuantity(product.id);
    const newQty = currentQty + 1;
    const selectedSize = selectedSizes[product.id];
    addToCart(product, 1, selectedSize);
    setQuantities((prev) => ({
      ...prev,
      [product.id]: newQty,
    }));
  };

  // Handle decrease quantity and remove from cart
  const handleDecreaseQty = (product) => {
    const currentQty = getQuantity(product.id);
    const newQty = currentQty - 1;
    const selectedSize = selectedSizes[product.id];
    if (newQty <= 0) {
      setQuantities((prev) => ({
        ...prev,
        [product.id]: 0,
      }));
      setActivated((prev) => ({
        ...prev,
        [product.id]: false,
      }));
    } else {
      addToCart(product, -1, selectedSize);
      setQuantities((prev) => ({
        ...prev,
        [product.id]: newQty,
      }));
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const displayProducts = products
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

      return (b.rating || 0) - (a.rating || 0);
    });

  // ⭐ open review modal
  const openReview = (productId) => {
    setReviewProductId(productId);
  };

  // ⭐ submit review
  const submitReview = () => {
    if (comment.trim().length < 4) {
      toast.error(t("buyer.reviewTooShort"));
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === reviewProductId) {
          const newReview = {
            rating,
            comment,
            reviewerName: user?.name || user?.email || "Anonymous",
            reviewDate: new Date().toLocaleDateString()
          };
          const newReviews = [...(p.reviews || []), newReview];

          const avgRating =
            newReviews.reduce((sum, review) => sum + review.rating, 0) /
            newReviews.length;

          return {
            ...p,
            reviews: newReviews,
            rating: avgRating,
          };
        }
        return p;
      })
    );

    setReviewProductId(null);
    setComment("");
    toast.success(t("buyer.reviewThanks"));
  };

  // 🎨 customization
  const requestCustomization = (product) => {
    setCustomProduct(product);
  };

  return (
    <div className="buyer-dashboard">
      <h1>{t("buyer.title")}</h1>
      <p className="buyer-subtitle">
        {t("buyer.subtitle")}
      </p>

      <div className="buyer-controls">
        <input
          type="text"
          placeholder={t("buyer.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="top-rated">{t("buyer.sortTopRated")}</option>
          <option value="price-low">{t("buyer.sortPriceLow")}</option>
          <option value="price-high">{t("buyer.sortPriceHigh")}</option>
        </select>
      </div>

      <div className="product-grid">
        {displayProducts.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="product-image-container">
              <img src={product.image} alt={product.name} />
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

            <p className="rating">⭐ {(product.rating || 4).toFixed(1)}</p>

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
                    activateProduct(product.id, product);
                  }}
                >
                  {t("buyer.addToCart")}
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

            <button
              className="review-btn"
              onClick={(e) => {
                e.stopPropagation();
                openReview(product.id);
              }}
            >
              {t("buyer.writeReview")}
            </button>

            <button
              className="custom-btn"
              onClick={(e) => {
                e.stopPropagation();
                requestCustomization(product);
              }}
            >
              {t("buyer.askCustomization")}
            </button>
          </div>
        ))}
      </div>

      {displayProducts.length === 0 && (
        <p className="empty-state">{t("buyer.noProducts")}</p>
      )}

      {/* ⭐ REVIEW MODAL */}
      {reviewProductId && (
        <div className="review-modal">
          <div className="review-box">
            <h3>{t("buyer.reviewTitle")}</h3>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value={5}>⭐⭐⭐⭐⭐</option>
              <option value={4}>⭐⭐⭐⭐</option>
              <option value={3}>⭐⭐⭐</option>
              <option value={2}>⭐⭐</option>
              <option value={1}>⭐</option>
            </select>

            <textarea
              placeholder={t("buyer.reviewPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button className="primary-action" onClick={submitReview}>
              {t("buyer.submitReview")}
            </button>
            <button className="ghost-action" onClick={() => setReviewProductId(null)}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* 🎨 CUSTOMIZATION MODAL */}
      {customProduct && (
        <div className="review-modal">
          <div className="review-box">
            <h3>{t("buyer.customTitle")} — {t(`products.${customProduct.name}`, customProduct.name)}</h3>

            <textarea
              placeholder={t("buyer.customPlaceholder")}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
            />

            <button
              className="primary-action"
              onClick={() => {
                if (customMsg.trim().length < 8) {
                  toast.error(t("buyer.customTooShort"));
                  return;
                }

                toast.success(t("buyer.customSent"));
                setCustomProduct(null);
                setCustomMsg("");
              }}
            >
              {t("buyer.sendRequest")}
            </button>

            <button className="ghost-action" onClick={() => setCustomProduct(null)}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerDashboard;