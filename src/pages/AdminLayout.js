import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;