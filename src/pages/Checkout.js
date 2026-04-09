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
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const total = Math.max(subtotal - discount, 0);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      setDiscount(0);
      setAppliedCoupon("");
      return;
    }

    if (code === "SAVE10") {
      setDiscount(subtotal * 0.1);
      setAppliedCoupon(code);
      return;
    }

    if (code === "FLAT100") {
      setDiscount(100);
      setAppliedCoupon(code);
      return;
    }

    if (code === "WELCOME50") {
      setDiscount(50);
      setAppliedCoupon(code);
      return;
    }

    setDiscount(0);
    setAppliedCoupon("");
    alert("Invalid coupon code");
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (!form.name || !form.address || !form.phone) {
      alert(t("checkout.fillDetails"));
      return;
    }

    localStorage.setItem("shipping", JSON.stringify(form));
    localStorage.setItem(
      "checkoutPricing",
      JSON.stringify({
        subtotal,
        discount,
        coupon: appliedCoupon,
        total,
      })
    );

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

          <div className="summary-divider" />

          <div className="summary-item">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="summary-item discount-line">
            <span>Discount</span>
            <span>-₹{discount.toFixed(0)}</span>
          </div>

          <div className="coupon-block">
            <h3>Coupon</h3>
            <div className="coupon-row">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter coupon code"
              />
              <button className="coupon-btn" type="button" onClick={applyCoupon}>
                Apply
              </button>
            </div>
            <div className="coupon-chip-row">
              <button type="button" onClick={() => setCoupon("SAVE10")}>SAVE10</button>
              <button type="button" onClick={() => setCoupon("FLAT100")}>FLAT100</button>
              <button type="button" onClick={() => setCoupon("WELCOME50")}>WELCOME50</button>
            </div>
            {appliedCoupon && <p className="coupon-applied">Applied: {appliedCoupon}</p>}
          </div>

          <hr />
          <h3 className="summary-total">{t("checkout.total")}: ₹{total.toFixed(0)}</h3>
        </div>
      </div>
    </div>
  );
}

export default Checkout;