import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import QRCode from "qrcode";
import "./Payment.css";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart } = useContext(CartContext);
  const { addOrder } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  const checkoutSummary = location.state?.checkoutSummary || {};
  const appliedCoupon = checkoutSummary.coupon || "";
  const discount = Number(checkoutSummary.discount) || 0;

  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");

  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [upiId, setUpiId] = useState("");
  const [upiQrCodeDataUrl, setUpiQrCodeDataUrl] = useState("");

  // ✅ Subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // ✅ COD Delivery Charge
  const deliveryCharge = selectedMethod === "cod" ? 100 : 0;

  // ✅ Final Total
  const total = Math.max(subtotal + deliveryCharge - discount, 0);
  const taxesAndFees = 0;
  const formattedAmount = total.toFixed(2);
  const merchantUpiId = "globalthreads@upi";
  const upiPaymentLink = `upi://pay?pa=${encodeURIComponent(
    merchantUpiId
  )}&pn=${encodeURIComponent("Global Threads")}&am=${encodeURIComponent(
    formattedAmount
  )}&cu=INR&tn=${encodeURIComponent("Global Threads Order Payment")}`;

  useEffect(() => {
    let isActive = true;

    QRCode.toDataURL(upiPaymentLink, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        if (isActive) {
          setUpiQrCodeDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (isActive) {
          setUpiQrCodeDataUrl("");
        }
      });

    return () => {
      isActive = false;
    };
  }, [upiPaymentLink]);

  const handlePayment = () => {
    if (selectedMethod === "card") {
      if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
        alert(t("payment.fillCardDetails", "Please fill all card details"));
        return;
      }
    }

    if (selectedMethod === "upi" && !upiId) {
      alert(t("payment.enterUpiId", "Please enter UPI ID"));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const newOrder = {
        id: Date.now(),
        username: user?.username || "guest",
        items: cart,
        subtotal,
        deliveryCharge,
        discount,
        coupon: appliedCoupon,
        total,
        paymentMethod: selectedMethod,
        date: new Date().toLocaleString(),
      };

      addOrder(newOrder);
      clearCart();

      alert(`✅ ${t("payment.success", "Payment Successful!")}`);
      navigate("/");
    }, 2000);
  };

  const paymentOptions = [
    {
      id: "card",
      label: t("payment.methodCard", "Credit Card"),
      note: t("payment.methodCardNote", "Fast and secure card payment"),
      icon: "CARD",
      brands: ["visa", "mastercard", "rupay"],
    },
    {
      id: "upi",
      label: "UPI",
      note: t("payment.methodUpiNote", "Pay instantly with any UPI app"),
      icon: "UPI",
      brands: ["gpay", "phonepe", "paytm"],
    },
    {
      id: "cod",
      label: t("payment.methodCod", "Cash on Delivery"),
      note: t("payment.methodCodNote", "Pay at doorstep (+₹100 delivery)"),
      icon: "COD",
      brands: ["doorstep"],
    },
  ];

  const renderBrandLogo = (brand) => {
    if (brand === "visa") {
      return (
        <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="Visa">
          <text x="8" y="13" className="brand-svg-text brand-svg-text-visa">VISA</text>
        </svg>
      );
    }

    if (brand === "mastercard") {
      return (
        <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="Mastercard">
          <circle cx="23" cy="9" r="5.5" fill="#eb001b" />
          <circle cx="31" cy="9" r="5.5" fill="#f79e1b" fillOpacity="0.9" />
        </svg>
      );
    }

    if (brand === "rupay") {
      return (
        <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="RuPay">
          <polygon points="10,14 17,4 24,14" fill="#0078be" />
          <polygon points="19,14 26,4 33,14" fill="#29a84a" fillOpacity="0.9" />
          <polygon points="28,14 35,4 42,14" fill="#f58220" fillOpacity="0.9" />
        </svg>
      );
    }

    if (brand === "gpay") {
      return (
        <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="Google Pay">
          <circle cx="27" cy="9" r="6" fill="#ffffff" />
          <path d="M27 3 A6 6 0 0 1 33 9" stroke="#4285f4" strokeWidth="2" fill="none" />
          <path d="M33 9 A6 6 0 0 1 27 15" stroke="#34a853" strokeWidth="2" fill="none" />
          <path d="M27 15 A6 6 0 0 1 21 9" stroke="#fbbc05" strokeWidth="2" fill="none" />
          <path d="M21 9 A6 6 0 0 1 27 3" stroke="#ea4335" strokeWidth="2" fill="none" />
        </svg>
      );
    }

    if (brand === "phonepe") {
      return (
        <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="PhonePe">
          <circle cx="27" cy="9" r="6" fill="#5f259f" />
          <path d="M24.5 6.5h3.8c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-3.8" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M26.4 5.8v6.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }

    if (brand === "paytm") {
      return (
        <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="Paytm">
          <rect x="19" y="4.5" width="16" height="9" rx="2" fill="#00baf2" />
          <rect x="21.5" y="6.5" width="11" height="5" rx="1.5" fill="#0f172a" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 54 18" className="brand-svg" role="img" aria-label="Doorstep">
        <rect x="19" y="6" width="16" height="6" rx="2" fill="#8b1e2d" />
        <circle cx="22" cy="13" r="1.4" fill="#8b1e2d" />
        <circle cx="32" cy="13" r="1.4" fill="#8b1e2d" />
      </svg>
    );
  };

  return (
    <div className="payment-page">
      <div className="payment-shell">
        <aside className="payment-method-panel">
          <h2>{t("payment.selectPayment", "3. Select payment")}</h2>
          <div className="payment-methods">
            {paymentOptions.map((method) => (
              <button
                key={method.id}
                type="button"
                className={`payment-method-option ${selectedMethod === method.id ? "active" : ""}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <span className="method-dot" />

                <div className="method-main">
                  <div className="method-header">
                    <span className="method-icon">{method.icon}</span>
                    <span className="method-label">{method.label}</span>
                  </div>
                  <span className="method-note">{method.note}</span>
                </div>

                <div className="method-brands">
                  {method.brands.map((brand) => (
                    <span key={brand} className={`brand-pill brand-pill-${brand}`}>
                      {renderBrandLogo(brand)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="payment-main-card">
          <div className="payment-summary-card">
            <h3>{t("payment.orderSummary", "Order Summary")}</h3>
            <p><span>{t("checkout.subtotal", "Subtotal")}</span><strong>₹{subtotal}</strong></p>
            <p><span>{t("payment.delivery", "Delivery")}</span><strong>₹{deliveryCharge}</strong></p>
            <p><span>{t("checkout.discount", "Discount")}</span><strong>-₹{discount}</strong></p>
            {appliedCoupon && <p><span>{t("checkout.couponTitle", "Coupon")}</span><strong>{appliedCoupon}</strong></p>}
            <p><span>{t("payment.taxesAndFees", "Taxes & Fees")}</span><strong>₹{taxesAndFees}</strong></p>
            <h2><span>{t("checkout.total", "Total")}</span><strong>₹{total}</strong></h2>
          </div>

          <div className="payment-form-card">
            <h3>{t("payment.secureDetails", "Secure Payment Details")}</h3>
            <div className="trust-row">
              <span className="trust-pill">{t("payment.trustSsl", "256-bit SSL")}</span>
              <span className="trust-pill">{t("payment.trustPci", "PCI Protected")}</span>
              <span className="trust-pill">{t("payment.trustFraud", "Fraud Shield")}</span>
            </div>

            {selectedMethod === "card" && (
              <div className="payment-form card-grid">
                <input
                  type="text"
                  placeholder={t("payment.nameOnCard", "Name on card")}
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder={t("payment.cardNumber", "0000 0000 0000 0000")}
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, number: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder={t("payment.cardExpiry", "MM / YY")}
                  value={cardDetails.expiry}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, expiry: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder={t("payment.cardCvc", "CVC code")}
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cvv: e.target.value })
                  }
                />
              </div>
            )}

            {selectedMethod === "upi" && (
              <div className="payment-form">
                <div className="upi-qr-box">
                  <p className="upi-qr-title">{t("payment.scanQr", "Scan QR to pay with any UPI app")}</p>
                  {upiQrCodeDataUrl ? (
                    <img
                      src={upiQrCodeDataUrl}
                      alt="UPI Payment QR"
                      className="upi-qr-image"
                    />
                  ) : (
                    <p className="upi-qr-fallback">{t("payment.qrLoadError", "Unable to load QR. Use UPI ID below.")}</p>
                  )}
                  <p className="upi-merchant-id">{t("payment.upiIdLabel", "UPI ID")}: {merchantUpiId}</p>
                  <p className="upi-payable-amount">{t("payment.payable", "Payable")}: ₹{formattedAmount}</p>
                </div>

                <input
                  type="text"
                  placeholder={t("payment.enterUpiIdPlaceholder", "Enter UPI ID")}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            {selectedMethod === "cod" && (
              <div className="payment-form cod-note">
                <p>{t("payment.codSelected", "Cash on Delivery selected.")}</p>
                <p>{t("payment.codChangeNote", "Please keep exact change ready when possible.")}</p>
              </div>
            )}

            <button
              className="pay-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? t("payment.processing", "Processing...") : t("payment.submitSecure", "Submit Secure Payment")}
            </button>

            <p className="secure-note">{t("payment.secureNote", "Encrypted and secure payments")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Payment;