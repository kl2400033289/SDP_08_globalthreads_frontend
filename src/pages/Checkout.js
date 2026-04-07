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
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const payableTotal = Math.max(total - discount, 0);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (code === "SAVE10") {
      setDiscount(total * 0.1);
      setAppliedCoupon(code);
      setCouponMessage(t("checkout.couponAppliedPercent", "10% discount applied."));
      return;
    }

    if (code === "FLAT100") {
      setDiscount(Math.min(100, total));
      setAppliedCoupon(code);
      setCouponMessage(t("checkout.couponAppliedFlat100", "₹100 discount applied."));
      return;
    }

    if (code === "WELCOME50") {
      setDiscount(Math.min(50, total));
      setAppliedCoupon(code);
      setCouponMessage(t("checkout.couponAppliedWelcome50", "₹50 discount applied."));
      return;
    }

    setDiscount(0);
    setAppliedCoupon("");
    setCouponMessage(t("checkout.invalidCoupon", "Invalid coupon code."));
  };

  const placeOrder = () => {
    if (!form.name || !form.address || !form.phone) {
      alert(t("checkout.fillDetails"));
      return;
    }

    // save shipping temporarily
    localStorage.setItem("shipping", JSON.stringify(form));

    navigate("/payment", {
      state: {
        checkoutSummary: {
          subtotal: total,
          discount,
          coupon: appliedCoupon,
          total: payableTotal,
        },
      },
    });
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

          <div className="checkout-total-row">
            <span>{t("checkout.subtotal", "Subtotal")}</span>
            <strong>₹{total}</strong>
          </div>

          <div className="checkout-total-row discount-row">
            <span>{t("checkout.discount", "Discount")}</span>
            <strong>-₹{discount}</strong>
          </div>

          <div className="checkout-total-row payable-row">
            <span>{t("checkout.amountToPay", "Amount to pay")}</span>
            <strong>₹{payableTotal}</strong>
          </div>

          <div className="coupon-area">
            <h3>{t("checkout.couponTitle", "Coupon")}</h3>
            <div className="coupon-box">
              <input
                type="text"
                placeholder={t("checkout.enterCouponCode", "Enter coupon code")}
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button type="button" className="coupon-btn" onClick={applyCoupon}>
                {t("checkout.applyCoupon", "Apply")}
              </button>
            </div>

            <div className="demo-coupons">
              <span onClick={() => setCoupon("SAVE10")}>SAVE10</span>
              <span onClick={() => setCoupon("FLAT100")}>FLAT100</span>
              <span onClick={() => setCoupon("WELCOME50")}>WELCOME50</span>
            </div>

            {couponMessage && <p className="coupon-message">{couponMessage}</p>}

            {appliedCoupon && (
              <p className="coupon-active">{t("checkout.appliedCoupon", "Applied")}: {appliedCoupon}</p>
            )}
          </div>

          <h3 className="checkout-grand-total">
            {t("checkout.total")}: ₹{payableTotal}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default Checkout;