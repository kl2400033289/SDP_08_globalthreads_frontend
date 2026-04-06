import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [wishlist, setWishlist] = useState([]);

  // ✅ Safe unique storage key
  const storageKey =
    user?.id
      ? `wishlist_${user.id}`
      : user?.email
      ? `wishlist_${user.email}`
      : "wishlist_guest";

  // ✅ Load wishlist when user changes
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(storageKey);
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlist([]);
    }
  }, [storageKey]);

  // ✅ Save wishlist whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    } catch (error) {
      console.error("Error saving wishlist:", error);
    }
  }, [wishlist, storageKey]);

  // ✅ Add item
  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  // ✅ Remove item
  const removeFromWishlist = (productId) => {
    setWishlist((prev) =>
      prev.filter((item) => item.id !== productId)
    );
  };

  // ✅ Check item
  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  // ✅ Toggle
  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};