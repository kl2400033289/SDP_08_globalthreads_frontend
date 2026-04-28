import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

const defaultUsers = [
  { id: 1, username: "admin", role: "admin", blocked: false },
  { id: 2, username: "buyer", role: "buyer", blocked: false },
  { id: 3, username: "artisan", role: "artisan", blocked: false },
];

const mergeUsers = (savedUsers) => {
  const combined = [...defaultUsers, ...(savedUsers || [])];
  const seen = new Set();

  return combined.filter((user) => {
    const key = user.email ? user.email.trim().toLowerCase() : `${user.role}:${user.username}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export function UserProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return mergeUsers(saved ? JSON.parse(saved) : []);
  });

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const removeUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleBlockUser = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, blocked: !u.blocked } : u
      )
    );
  };

  return (
    <UserContext.Provider value={{ users, removeUser, toggleBlockUser }}>
      {children}
    </UserContext.Provider>
  );
}