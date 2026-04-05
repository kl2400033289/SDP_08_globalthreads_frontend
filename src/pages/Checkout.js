import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import "./Checkout.css";

function Checkout() {
  const { cart } = useContext(CartContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const placeOrder = () => {
    if (!form.name || !form.address || !form.phone) {
      alert(t("checkout.fillDetails"));
      return;
    }

    // save shipping temporarily
    localStorage.setItem("shipping", JSON.stringify(form));

    navigate("/payment");
  };

  return (
    <div className="checkout-page">
      <h1>{t("checkout.title")}</h1>

      <div className="checkout-grid">
        {/* ===== ADDRESS FORM ===== */}
        <div className="checkout-form">
          <h2>{t("checkout.shippingTitle")}</h2>

          <input
            type="text"
            name="name"
            placeholder={t("checkout.enterFullName")}
            value={form.name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder={t("checkout.enterAddress")}
            value={form.address}
            onChange={handleChange}
          />

          <input
            type="tel"
            name="phone"
            placeholder={t("checkout.enterPhone")}
            value={form.phone}
            onChange={handleChange}
          />

          <button className="place-order-btn" onClick={placeOrder}>
            {t("checkout.proceedToPayment")}
          </button>
        </div>

        {/* ===== ORDER SUMMARY ===== */}
        <div className="checkout-summary">
          <h2>{t("checkout.orderSummary")}</h2>

          {cart.map((item) => (
            <div key={item.id} className="summary-item">
              <span>
                {item.name} × {item.qty}
              </span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}

          <hr />
          <h3>{t("checkout.total")}: ₹{total}</h3>
        </div>
      </div>
    </div>
  );
}

export default Checkout;