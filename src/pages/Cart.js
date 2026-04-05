import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "./Cart.css";

function Cart() {
  const { cart, removeFromCart, updateQty } = useContext(CartContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
    
  );

  return (
    <div className="cart-page">
      <h1>{t("cart.title")}</h1>

      {cart.length === 0 ? (
        <p className="cart-empty">{t("cart.empty")}</p>
      ) : (
        <>
          {cart.map((item) => (
            <div key={`${item.id}-${item.size}`} className="cart-item">
              <img src={item.image} alt={item.name} />

              <div className="cart-info">
                <h3>{t(`products.${item.name}`, item.name)}</h3>
                {item.size && <p className="item-size">{t("cart.sizeLabel")}: {item.size}</p>}
                <div className="qty-controls">
                  <button onClick={() => updateQty(item.id, item.size, -1)}>
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.size, 1)}>
                    +
                  </button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id, item.size)}
                >
                  {t("cart.remove")}
                </button>
              </div>
            </div>
          ))}

          <div className="cart-footer">
            <h2 className="cart-total">{t("cart.total")}: ₹{total}</h2>
            <button className="checkout-btn" onClick={() => navigate("/checkout")}>
              {t("cart.proceed")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;