import { useContext } from "react";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import "./OrderHistory.css";

const trackingSteps = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const getStepDate = (order, step) => {
  const entry = [...(order.trackingTimeline || [])]
    .reverse()
    .find((item) => item.status === step);

  if (!entry?.at) {
    return "";
  }

  return entry.at.split(",")[0];
};

function OrderHistory() {
  const { orders } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  const trackingLabel = {
    placed: t("tracking.placed", "Order Placed"),
    confirmed: t("tracking.confirmed", "Confirmed"),
    processing: t("tracking.processing", "Processing"),
    shipped: t("tracking.shipped", "Shipped"),
    out_for_delivery: t("tracking.outForDelivery", "Out for Delivery"),
    delivered: t("tracking.delivered", "Delivered"),
  };

  const userOrders = orders.filter(
    (order) => order.username === user?.username
  );

  return (
    <div className="orders-page">
      <h1>📦 {t("orders.title")}</h1>

      {userOrders.length === 0 ? (
        <p>{t("orders.none")}</p>
      ) : (
        <div className="orders-grid">
          {userOrders.map((order) => {
            const activeIndex = Math.max(
              trackingSteps.indexOf(order.trackingStatus || "placed"),
              0
            );
            const progressPercent =
              trackingSteps.length > 1
                ? (activeIndex / (trackingSteps.length - 1)) * 100
                : 0;

            return (
              <div key={order.id} className="order-card">
                <h3>{t("orders.order")} #{order.id}</h3>
                <p>{t("orders.date")}: {order.date}</p>
                <p>{t("orders.total")}: ₹{order.total}</p>

                <p className="tracking-status-line">
                  {t("orders.trackingStatus", "Tracking Status")}: <strong>{trackingLabel[order.trackingStatus] || t("tracking.placed", "Order Placed")}</strong>
                </p>

                <div
                  className="tracking-steps"
                  style={{ "--track-progress": `${progressPercent}%` }}
                >
                  {trackingSteps.map((step, stepIndex) => {
                    const isDone = stepIndex < activeIndex;
                    const isCurrent = stepIndex === activeIndex;
                    const stepDate = getStepDate(order, step);

                    return (
                      <div
                        key={step}
                        className={`tracking-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}
                      >
                        <span className="tracking-dot" />
                        <span className="tracking-label">{trackingLabel[step]}</span>
                        <span className="tracking-date">{stepDate || "-"}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <img src={item.image} alt={item.name} />
                      <span>
                        {t(`products.${item.name}`, item.name)} × {item.qty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;