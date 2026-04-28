import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import "./AdminDashboard.css";

function Users() {
  const { users, removeUser, toggleBlockUser } = useContext(UserContext);
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="admin-title">Users ({users.length})</h1>

      {users.length === 0 ? (
        <p className="empty-text">No users found.</p>
      ) : (
        <div className="users-grid">
          {users.map((u) => (
            <div key={u.id} className="user-card">
              <h3>👤 {u.username}</h3>
              <p><strong>Role:</strong> {u.role}</p>
              <p>
                <strong>Status:</strong>{" "}
                {u.blocked ? "🚫 Blocked" : "✅ Active"}
              </p>

              <div className="user-actions">
                <button
                  className="block-btn"
                  onClick={() => toggleBlockUser(u.id)}
                >
                  {u.blocked ? "Unblock" : "Block"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() => removeUser(u.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Users;