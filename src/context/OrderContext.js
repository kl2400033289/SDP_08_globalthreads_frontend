import { createContext, useState, useEffect } from "react";

export const OrderContext = createContext();

const defaultTrackingStatus = "placed";

const normalizeOrder = (order) => {
  const trackingStatus = order.trackingStatus || defaultTrackingStatus;
  const trackingTimeline =
    order.trackingTimeline && order.trackingTimeline.length > 0
      ? order.trackingTimeline
      : [
          {
            status: trackingStatus,
            updatedBy: "system",
            at: order.date || new Date().toLocaleString(),
          },
        ];

  return {
    ...order,
    trackingStatus,
    trackingTimeline,
  };
};

export function OrderProvider({ children }) {
  // ✅ load saved orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("orders");
    return saved ? JSON.parse(saved).map(normalizeOrder) : [];
  });

  // ✅ persist orders
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  // 🔹 add new order
  const addOrder = (order) => {
    setOrders((prev) => [normalizeOrder(order), ...prev]);
  };

  const updateOrderTracking = (orderId, status, updatedBy = "system") => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        if (order.trackingStatus === status) {
          return order;
        }

        return {
          ...order,
          trackingStatus: status,
          trackingTimeline: [
            ...(order.trackingTimeline || []),
            {
              status,
              updatedBy,
              at: new Date().toLocaleString(),
            },
          ],
        };
      })
    );
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderTracking }}>
      {children}
    </OrderContext.Provider>
  );
}