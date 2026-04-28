import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // persist login
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);


  const login = (email, password) => {
    const users = {
      admin: { password: "admin123", role: "admin", email: "admin@globalthreads.com" },
      artisan: { password: "artisan123", role: "artisan", email: "artisan@globalthreads.com" },
      buyer: { password: "buyer123", role: "buyer", email: "buyer@globalthreads.com" },
      marketing: { password: "marketing123", role: "marketing", email: "marketing@globalthreads.com" },
    };

    const normalizedEmail = email.trim().toLowerCase();
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    const customUser = storedUsers.find(
      (entry) => entry.email && entry.email.trim().toLowerCase() === normalizedEmail
    );

    if (customUser && customUser.password === password) {
      setUser({ role: customUser.role, username: customUser.username, email: customUser.email });
      return { success: true, role: customUser.role };
    }

    const foundUser = Object.values(users).find((entry) => entry.email === normalizedEmail);

    if (foundUser && foundUser.password === password) {
      setUser({ role: foundUser.role, username: foundUser.role, email: foundUser.email });
      return { success: true, role: foundUser.role };
    }

    return { success: false };
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}