import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // persist login
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const login = (emailOrUsername, password) => {
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

    const normalizedIdentifier = emailOrUsername.trim().toLowerCase();

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    
    // Try to find by email first
    let customUser = storedUsers.find(
      (entry) =>
        entry.email && entry.email.trim().toLowerCase() === normalizedIdentifier
    );

    // If no email match, find all users with matching username
    if (!customUser) {
      const usernameMatches = storedUsers.filter(
        (entry) =>
          entry.username.trim().toLowerCase() === normalizedIdentifier
      );
      
      // Try each username match to find one with correct password
      customUser = usernameMatches.find(
        (entry) => entry.password === password
      );
    }

    if (customUser && customUser.password === password) {
      setUser({ role: customUser.role, username: customUser.username, email: customUser.email });
      return { success: true, role: customUser.role };
    }

    const foundDemoUser = Object.values(demoUsers).find(
      (entry) =>
        entry.username === normalizedIdentifier ||
        entry.email === normalizedIdentifier
    );

    if (foundDemoUser && foundDemoUser.password === password) {
      setUser({ role: foundDemoUser.role, username: foundDemoUser.username });
      return { success: true, role: foundDemoUser.role };
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