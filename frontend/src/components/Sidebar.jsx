import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Moon,
  Shield,
  Brain,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const auth = useAuth();
  const user = auth.user;
  const navigate = useNavigate();

  const handleLogout = () => {
    if (auth.logout) {
      auth.logout();
    } else {
      localStorage.removeItem("gamebalance_token");
      localStorage.removeItem("gamebalance_user");
    }

    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Gamepad2 size={24} />
        <span>GameBalance</span>
      </div>

      <nav>
        <NavLink to="/dashboard">
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        <NavLink to="/gaming">
          <Gamepad2 size={16} />
          Gaming Tracker
        </NavLink>

        <NavLink to="/stress">
          <Brain size={16} />
          Stress Monitor
        </NavLink>

        <NavLink to="/sleep">
          <Moon size={16} />
          Sleep Tracker
        </NavLink>

        <NavLink to="/risk">
          <BarChart3 size={16} />
          Risk Reports
        </NavLink>

        <NavLink to="/weekly-report">
          <FileText size={16} />
          Weekly Report
        </NavLink>

        <NavLink to="/profile">
          <User size={16} />
          Profile
        </NavLink>

        {user?.role === "ADMIN" && (
          <NavLink to="/admin">
            <Shield size={16} />
            Admin Panel
          </NavLink>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={17} />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;