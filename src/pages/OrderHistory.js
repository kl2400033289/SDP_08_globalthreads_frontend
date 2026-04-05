import { useContext } from "react";
import { OrderContext } from "../context/OrderContext";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import "./OrderHistory.css";

function OrderHistory() {
  const { orders } = useContext(OrderContext);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

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
          <div key={order.id} className="order-card">
            <h3>{t("orders.order")} #{order.id}</h3>
            <p>{t("orders.date")}: {order.date}</p>
            <p>{t("orders.total")}: ₹{order.total}</p>

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
        ))
      )}
    </div>
  );
}

export default OrderHistory;