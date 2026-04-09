import { useContext } from "react";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import "./OrderHistory.css";

const TRACKING_STAGES = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const STAGE_HOUR_OFFSETS = [0, 1, 3, 8, 18, 30];

function OrderHistory() {
  const { orders } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  const resolveOrderDate = (order) => {
    if (order.createdAt) {
      const date = new Date(order.createdAt);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    if (typeof order.id === "number" && String(order.id).length >= 12) {
      const dateFromId = new Date(order.id);
      if (!Number.isNaN(dateFromId.getTime())) {
        return dateFromId;
      }
    }

    const fallbackDate = new Date(order.date);
    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    return new Date();
  };

  const getTrackingStep = (order) => {
    if (typeof order.trackingStep === "number") {
      return Math.max(0, Math.min(order.trackingStep, TRACKING_STAGES.length - 1));
    }

    const placedAt = resolveOrderDate(order).getTime();
    const now = Date.now();
    const elapsedHours = Math.max((now - placedAt) / (1000 * 60 * 60), 0);

    let step = 0;
    for (let i = 0; i < STAGE_HOUR_OFFSETS.length; i += 1) {
      if (elapsedHours >= STAGE_HOUR_OFFSETS[i]) {
        step = i;
      }
    }

    return step;
  };

  const formatDate = (value) =>
    value.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatDateTime = (value) =>
    value.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const userOrders = orders.filter(
    (order) => order.username === user?.username
  );

  return (
    <div className="orders-page">
      <h1>📦 {t("orders.title")}</h1>

      {userOrders.length === 0 ? (
        <p>{t("orders.none")}</p>
      ) : (
        userOrders.map((order) => (
          <div key={order.id} className="order-card timeline-card">
            {(() => {
              const placedAt = resolveOrderDate(order);
              const currentStep = getTrackingStep(order);
              const trackingStatus = TRACKING_STAGES[currentStep];

              return (
                <>
                  <h3>{t("orders.order")} #{order.id}</h3>
                  <p>{t("orders.date")}: {formatDateTime(placedAt)}</p>
                  <p>{t("orders.total")}: ₹{order.total}</p>

                  <p className="tracking-status">
                    Tracking Status: <strong>{trackingStatus}</strong>
                  </p>

                  <div className="tracking-timeline" role="list" aria-label="Order tracking timeline">
                    <div
                      className="timeline-progress"
                      style={{
                        width: `${(currentStep / (TRACKING_STAGES.length - 1)) * 100}%`,
                      }}
                    />

                    {TRACKING_STAGES.map((label, index) => {
                      const completed = index <= currentStep;
                      const stageDate = completed
                        ? new Date(placedAt.getTime() + STAGE_HOUR_OFFSETS[index] * 60 * 60 * 1000)
                        : null;

                      return (
                        <div key={label} className="timeline-stage" role="listitem">
                          <div className={`stage-dot ${completed ? "done" : "pending"}`} />
                          <span className="stage-label">{label}</span>
                          <span className="stage-date">{stageDate ? formatDate(stageDate) : "-"}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="order-items">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.id}-${item.size || "nosize"}`} className="order-item">
                        <img src={item.image} alt={item.name} />
                        <span>
                          {t(`products.${item.name}`, item.name)} × {item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        ))
      )}
    </div>
  );
}

export default OrderHistory;