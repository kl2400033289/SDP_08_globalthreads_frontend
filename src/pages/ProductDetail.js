import { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import "./ProductDetail.css";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, setProducts } = useContext(ProductContext);
  const { cart, addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const { t } = useLanguage();

  const [selectedSize, setSelectedSize] = useState("");
  const [reviewProductId, setReviewProductId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customProduct, setCustomProduct] = useState(null);
  const [customMsg, setCustomMsg] = useState("");

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

  const product = products.find((p) => p.id === parseInt(id));
  const availableSizes = product?.sizes?.length ? product.sizes : sizes;

  // Get quantity from cart for selected size
  const cartItem = cart.find(
    (item) => item.id === parseInt(id) && item.size === selectedSize
  );
  const currentQty = cartItem ? cartItem.qty : 0;

  if (!product) {
    return (
      <div className="product-detail-page">
        <p>Product not found</p>
        <button onClick={() => navigate("/shop")}>Back to Shop</button>
      </div>
    );
  }

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const handleActivateProduct = () => {
    if (!user) {
      toast.error(t("shop.loginToAdd"));
      navigate("/login");
      return;
    }
    if (!selectedSize) {
      toast.error(t("productDetail.selectSizeError"));
      return;
    }
    addToCart(product, 1, selectedSize);
    toast.success(t("shop.addedToCart"));
  };

  const handleIncreaseQty = () => {
    addToCart(product, 1, selectedSize);
  };

  const handleDecreaseQty = () => {
    addToCart(product, -1, selectedSize);
  };

  return (
    <div className="product-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="product-detail-container">
        <div className="product-image-section">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) =>
              (e.target.src =
                "https://via.placeholder.com/500x500?text=Product")
            }
          />
          <button
            className={`heart-btn-detail ${isInWishlist(product.id) ? "active" : ""}`}
            onClick={() => {
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

        <div className="product-info-section">
          <h1>{t(`products.${product.name}`, product.name)}</h1>
          
          <div className="product-meta">
            <span className="rating">⭐ {(product.rating || 0).toFixed(1)}</span>
            {product.reviews && (
              <span className="reviews">
                ({product.reviews.length} {t("common.reviews", "reviews")})
              </span>
            )}
          </div>

          <div className="pricing">
            <p className="price">{formatPrice(product.price)}</p>
            {product.cost && (
              <p className="cost">Cost: {formatPrice(product.cost)}</p>
            )}
          </div>

          {product.description && (
            <div className="description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.designNotes && (
            <div className="design-notes">
              <h3>Design Details</h3>
              <p>{product.designNotes}</p>
            </div>
          )}

          {/* Size Selector */}
          <div className="size-selector-section">
            <h3>{t("productDetail.selectSize")}</h3>
            <div className="size-selector">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? "active" : ""}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {t(`productDetail.sizes.${size}`, size)}
                </button>
              ))}
            </div>
          </div>

          <div className="product-actions">
            {!selectedSize ? (
              <div className="size-warning">{t("productDetail.selectSizeWarning")}</div>
            ) : currentQty === 0 ? (
              <button className="add-btn" onClick={handleActivateProduct}>
                {t("shop.addToCart")}
              </button>
            ) : (
              <div className="qty-selector">
                <button className="qty-btn" onClick={handleDecreaseQty}>
                  −
                </button>
                <span className="qty-display">{currentQty}</span>
                <button className="qty-btn" onClick={handleIncreaseQty}>
                  +
                </button>
              </div>
            )}
          </div>

          <div className="product-extra-actions">
            <button
              className="review-btn"
              onClick={() => setReviewProductId(product.id)}
            >
              {t("buyer.writeReview")}
            </button>
            <button
              className="custom-btn"
              onClick={() => setCustomProduct(product)}
            >
              {t("buyer.askCustomization")}
            </button>
          </div>

          {product.reviews && product.reviews.length > 0 && (
            <div className="reviews-section">
              <h3>{t("productDetail.customerReviews")}</h3>
              <div className="reviews-list">
                {product.reviews.map((review, idx) => (
                  <div key={idx} className="review-item">
                    <div className="review-header">
                      <span className="review-rating">⭐ {review.rating}</span>
                      <span className="review-reviewer">{review.reviewerName}</span>
                      <span className="review-date">{review.reviewDate}</span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {reviewProductId && (
        <div className="review-modal" onClick={() => setReviewProductId(null)}>
          <div className="review-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t("buyer.reviewTitle")}</h3>
            <select
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
            >
              <option value={1}>{t("productDetail.ratingPoor")}</option>
              <option value={2}>{t("productDetail.ratingFair")}</option>
              <option value={3}>{t("productDetail.ratingGood")}</option>
              <option value={4}>{t("productDetail.ratingVeryGood")}</option>
              <option value={5}>{t("productDetail.ratingExcellent")}</option>
            </select>
            <textarea
              placeholder={t("buyer.reviewPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="primary-action"
                onClick={() => {
                  if (comment.trim().length < 4) {
                    toast.error(t("buyer.reviewTooShort"));
                    return;
                  }
                  const newReview = { 
                    rating, 
                    comment,
                    reviewerName: user?.name || user?.email || "Anonymous",
                    reviewDate: new Date().toLocaleDateString()
                  };
                  const updatedProduct = {
                    ...product,
                    reviews: [...(product.reviews || []), newReview],
                  };
                  const avgRating =
                    (updatedProduct.reviews.reduce((sum, r) => sum + r.rating, 0) /
                      updatedProduct.reviews.length).toFixed(1);
                  updatedProduct.rating = parseFloat(avgRating);
                  
                  // Update the product in the global context
                  const updatedProducts = products.map(p => 
                    p.id === product.id ? updatedProduct : p
                  );
                  setProducts(updatedProducts);
                  
                  setReviewProductId(null);
                  setComment("");
                  setRating(5);
                  toast.success(t("buyer.reviewThanks"));
                }}
              >
                {t("buyer.submitReview")}
              </button>
              <button
                className="ghost-action"
                onClick={() => setReviewProductId(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZATION MODAL */}
      {customProduct && (
        <div className="review-modal" onClick={() => setCustomProduct(null)}>
          <div className="review-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t("buyer.customTitle")}</h3>
            <textarea
              placeholder={t("buyer.customPlaceholder")}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="primary-action"
                onClick={() => {
                  if (customMsg.trim().length < 4) {
                    toast.error(t("buyer.customTooShort"));
                    return;
                  }
                  setCustomProduct(null);
                  setCustomMsg("");
                  toast.success(t("buyer.customSent"));
                }}
              >
                {t("buyer.sendRequest")}
              </button>
              <button
                className="ghost-action"
                onClick={() => setCustomProduct(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;