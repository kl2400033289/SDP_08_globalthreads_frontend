import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);

  // ✅ load from localStorage
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ persist cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // 🔐 AUTO CLEAR when user logs out ⭐⭐⭐
  useEffect(() => {
    if (!user) {
      setCart([]);
      localStorage.removeItem("cart");
    }
  }, [user]);

  // 🔹 add to cart with optional quantity and size
  const addToCart = (product, quantity = 1, size = "") => {
    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.id === product.id && item.size === size
      );

      if (existing) {
        const newQty = existing.qty + quantity;
        if (newQty <= 0) {
          return prevCart.filter(
            (item) => !(item.id === product.id && item.size === size)
          );
        }
        return prevCart.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, qty: newQty }
            : item
        );
      }

      if (quantity <= 0) {
        return prevCart;
      }

      return [...prevCart, { ...product, qty: quantity, size }];
    });
  };

  // 🔹 remove item by product id + size
  const removeFromCart = (id, size = "") => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.size === size))
    );
  };

  // 🔹 change quantity for product id + size
  const updateQty = (id, size = "", delta) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.size === size
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  // 🔹 manual clear (still useful)
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}