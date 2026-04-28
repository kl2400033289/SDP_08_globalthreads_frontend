import { useContext } from "react";
import { OrderContext } from "../context/OrderContext";
import { useLanguage } from "../context/LanguageContext";
import "./AdminDashboard.css";

function Transactions() {
  const { orders } = useContext(OrderContext);
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="admin-title">Transactions & Orders</h1>

      {orders.length === 0 ? (
        <p className="empty-text">No transactions found.</p>
      ) : (
        <div className="admin-orders">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>👤 {order.username}</h3>
              <p><strong>Total:</strong> ₹{order.total}</p>
              <p><strong>Items:</strong> {order.items?.length}</p>
              {order.status && <p><strong>Status:</strong> {order.status}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Transactions;