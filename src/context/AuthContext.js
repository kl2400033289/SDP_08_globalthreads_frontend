import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Persist login state and avoid writing "null" user payloads.
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = (email, password) => {
    const demoUsers = {
      admin: {
        password: "admin123",
        role: "admin",
        username: "admin",
        email: "admin@globalthreads.com",
      },
      artisan: {
        password: "artisan123",
        role: "artisan",
        username: "artisan",
        email: "artisan@globalthreads.com",
      },
      buyer: {
        password: "buyer123",
        role: "buyer",
        username: "buyer",
        email: "buyer@globalthreads.com",
      },
      marketing: {
        password: "marketing123",
        role: "marketing",
        username: "marketing",
        email: "marketing@globalthreads.com",
      },
    };

    const normalizedEmail = email.trim().toLowerCase();

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    // Email-only login for custom users.
    const customUser = storedUsers.find(
      (entry) =>
        entry.email && entry.email.trim().toLowerCase() === normalizedEmail
    );

    if (customUser && customUser.password === password) {
      setUser({ role: customUser.role, username: customUser.username, email: customUser.email });
      return { success: true, role: customUser.role };
    }

    const foundDemoUser = Object.values(demoUsers).find(
      (entry) => entry.email === normalizedEmail
    );

    if (foundDemoUser && foundDemoUser.password === password) {
      setUser({
        role: foundDemoUser.role,
        username: foundDemoUser.username,
        email: foundDemoUser.email,
      });
      return { success: true, role: foundDemoUser.role };
    }

    return { success: false };
  };

  const setAuthenticatedUser = ({ email, username, role }) => {
    const resolvedRole = (role || "buyer").toLowerCase();
    const resolvedUsername =
      username || (email ? email.split("@")[0] : resolvedRole);

    setUser({
      role: resolvedRole,
      username: resolvedUsername,
      email: email || "",
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, setAuthenticatedUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}