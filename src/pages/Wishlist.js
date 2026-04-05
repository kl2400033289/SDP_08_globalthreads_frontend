import { useContext, useState } from "react";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./Wishlist.css";

function Wishlist() {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [quantities, setQuantities] = useState({});
  const [activated, setActivated] = useState({});

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

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error(t("shop.loginToAdd"));
      navigate("/login");
      return;
    }
    addToCart(product, 1, "");
    setActivated((prev) => ({
      ...prev,
      [product.id]: true,
    }));
    setQuantities((prev) => ({
      ...prev,
      [product.id]: 1,
    }));
    toast.success(t("shop.addedToCart"));
  };

  const handleIncreaseQty = (product) => {
    const currentQty = getQuantity(product.id);
    const newQty = currentQty + 1;
    addToCart(product, 1, "");
    setQuantities((prev) => ({
      ...prev,
      [product.id]: newQty,
    }));
  };

  const handleDecreaseQty = (product) => {
    const currentQty = getQuantity(product.id);
    const newQty = currentQty - 1;
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
      addToCart(product, -1, "");
      setQuantities((prev) => ({
        ...prev,
        [product.id]: newQty,
      }));
    }
  };

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId);
    toast.success("Removed from wishlist");
  };

  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <p>Your wishlist is empty</p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/shop")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div>
          <p className="wishlist-count">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} in
            wishlist
          </p>
          <div className="wishlist-grid">
            {wishlist.map((product) => (
              <div key={product.id} className="wishlist-card">
                <div className="wishlist-image">
                  <img
                    src={product.image}
                    alt={product.name}
                    onClick={() => navigate(`/product/${product.id}`)}
                    onError={(e) =>
                      (e.target.src =
                        "https://via.placeholder.com/300x300?text=Product")
                    }
                  />
                </div>
                <div className="wishlist-info">
                  <h3 onClick={() => navigate(`/product/${product.id}`)}>
                    {t(`products.${product.name}`, product.name)}
                  </h3>
                  <p className="rating">⭐ {(product.rating || 0).toFixed(1)}</p>
                  <p className="price">{formatPrice(product.price)}</p>

                  <div className="wishlist-actions">
                    {!isActivated(product.id) ? (
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="qty-selector">
                        <button
                          className="qty-btn"
                          onClick={() => handleDecreaseQty(product)}
                        >
                          −
                        </button>
                        <span className="qty-display">{getQuantity(product.id)}</span>
                        <button
                          className="qty-btn"
                          onClick={() => handleIncreaseQty(product)}
                        >
                          +
                        </button>
                      </div>
                    )}
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromWishlist(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
