import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import QRCode from "qrcode";
import "./Payment.css";

function Payment() {
  const navigate = useNavigate();
  const { cart, clearCart } = useContext(CartContext);
  const { addOrder } = useContext(OrderContext);
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [error, setError] = useState("");

  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [upiId, setUpiId] = useState("");

  const [pricing, setPricing] = useState({
    subtotal: 0,
    discount: 0,
    coupon: "",
    total: 0,
  });
  const [upiQrCodeDataUrl, setUpiQrCodeDataUrl] = useState("");

  const computedSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const deliveryCharge = selectedMethod === "cod" ? 100 : 0;
  const taxesAndFees = 0;
  const subtotal = pricing.subtotal || computedSubtotal;
  const discount = pricing.discount || 0;
  const total = Math.max(subtotal + deliveryCharge + taxesAndFees - discount, 0);
  const formattedAmount = total.toFixed(2);
  const merchantUpiId = "globalthreads@upi";
  const upiPaymentLink = `upi://pay?pa=${encodeURIComponent(
    merchantUpiId
  )}&pn=${encodeURIComponent("Global Threads")}&am=${encodeURIComponent(
    formattedAmount
  )}&cu=INR&tn=${encodeURIComponent("Global Threads Order Payment")}`;

  useEffect(() => {
    const storedPricing = localStorage.getItem("checkoutPricing");

    if (!storedPricing) {
      setPricing({
        subtotal: computedSubtotal,
        discount: 0,
        coupon: "",
        total: computedSubtotal,
      });
      return;
    }

    try {
      const parsed = JSON.parse(storedPricing);
      setPricing({
        subtotal: Number(parsed.subtotal) || computedSubtotal,
        discount: Number(parsed.discount) || 0,
        coupon: parsed.coupon || "",
        total: Number(parsed.total) || computedSubtotal,
      });
    } catch {
      setPricing({
        subtotal: computedSubtotal,
        discount: 0,
        coupon: "",
        total: computedSubtotal,
      });
    }
  }, [computedSubtotal]);

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

  const isCardNumberValid = /^\d{12,19}$/.test(cardDetails.number.replace(/\s+/g, ""));
  const isExpiryValid = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardDetails.expiry.trim());
  const isCvvValid = /^\d{3,4}$/.test(cardDetails.cvv.trim());
  const isUpiValid = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim());

  const handlePayment = () => {
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (selectedMethod === "card") {
      if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
        setError("Please fill all card details");
        return;
      }

      if (!isCardNumberValid || !isExpiryValid || !isCvvValid) {
        setError("Please enter valid card details");
        return;
      }
    }

    if (selectedMethod === "upi") {
      if (!upiId) {
        setError("Please enter UPI ID");
        return;
      }

      if (!isUpiValid) {
        setError("Please enter a valid UPI ID");
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      const shipping = JSON.parse(localStorage.getItem("shipping") || "{}");
      const createdAt = new Date().toISOString();

      const newOrder = {
        id: Date.now(),
        username: user?.username || "guest",
        items: cart,
        shipping,
        subtotal,
        deliveryCharge,
        discount,
        total,
        coupon: pricing.coupon || "",
        paymentMethod: selectedMethod,
        trackingStep: 0,
        trackingStatus: "Order Placed",
        createdAt,
        date: new Date().toLocaleString(),
      };

      addOrder(newOrder);
      clearCart();
      localStorage.removeItem("checkoutPricing");

      alert("Payment successful");
      navigate("/orders");
    }, 2000);
  };

  return (
    <div className="payment-page">
      <div className="payment-layout">
        <aside className="payment-method-panel">
          <h2>3. Select payment</h2>

          <button
            type="button"
            className={`method-card ${selectedMethod === "card" ? "active" : ""}`}
            onClick={() => setSelectedMethod("card")}
          >
            <input type="radio" checked={selectedMethod === "card"} readOnly />
            <div>
              <strong>Credit Card</strong>
              <p>Fast and secure card payment</p>
            </div>
          </button>

          <button
            type="button"
            className={`method-card ${selectedMethod === "upi" ? "active" : ""}`}
            onClick={() => setSelectedMethod("upi")}
          >
            <input type="radio" checked={selectedMethod === "upi"} readOnly />
            <div>
              <strong>UPI</strong>
              <p>Pay instantly with any UPI app</p>
            </div>
          </button>

          <button
            type="button"
            className={`method-card ${selectedMethod === "cod" ? "active" : ""}`}
            onClick={() => setSelectedMethod("cod")}
          >
            <input type="radio" checked={selectedMethod === "cod"} readOnly />
            <div>
              <strong>Cash on Delivery</strong>
              <p>Pay at doorstep (+₹100 delivery)</p>
            </div>
          </button>
        </aside>

        <section className="payment-main-panel">
          <div className="order-summary-box">
            <h2>Order Summary</h2>
            <div className="summary-line"><span>Subtotal</span><strong>₹{subtotal.toFixed(0)}</strong></div>
            <div className="summary-line"><span>Delivery</span><strong>₹{deliveryCharge.toFixed(0)}</strong></div>
            <div className="summary-line"><span>Discount</span><strong>-₹{discount.toFixed(0)}</strong></div>
            <div className="summary-line"><span>Taxes & Fees</span><strong>₹{taxesAndFees.toFixed(0)}</strong></div>
            {pricing.coupon && <p className="coupon-note">Coupon applied: {pricing.coupon}</p>}
            <div className="summary-divider" />
            <div className="summary-total"><span>Total</span><strong>₹{total.toFixed(0)}</strong></div>
          </div>

          <div className="payment-details-box">
            <h3>Secure Payment Details</h3>
            <div className="security-tags">
              <span>256-bit SSL</span>
              <span>PCI Protected</span>
              <span>Fraud Shield</span>
            </div>

            {selectedMethod === "card" && (
              <div className="payment-form-grid">
                <input
                  type="text"
                  placeholder="Name on card"
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, number: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, expiry: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="CVC code"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cvv: e.target.value })
                  }
                />
              </div>
            )}

            {selectedMethod === "upi" && (
              <div className="upi-block">
                <div className="upi-qr-box">
                  <p>Scan to pay via UPI</p>
                  {upiQrCodeDataUrl ? (
                    <img src={upiQrCodeDataUrl} alt="UPI QR" className="upi-qr-image" />
                  ) : (
                    <p className="upi-qr-fallback">Unable to load QR. Use UPI ID below.</p>
                  )}
                  <p>UPI ID: {merchantUpiId}</p>
                  <p>Amount: ₹{formattedAmount}</p>
                </div>
                <input
                  type="text"
                  placeholder="Enter UPI ID"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            {selectedMethod === "cod" && (
              <div className="cod-note">
                Cash on Delivery selected. Delivery partner will collect ₹{total.toFixed(0)} at your address.
              </div>
            )}

            {error && <p className="payment-error">{error}</p>}

            <button className="pay-btn" onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : "Submit Secure Payment"}
            </button>
            <p className="secure-note">Encrypted and secure payments</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Payment;