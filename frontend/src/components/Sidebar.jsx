
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  BarChart3,
  Brain,
  FileText,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Moon,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const auth = useAuth();
  const user = auth.user;
  const navigate = useNavigate();

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    if (auth.logout) {
      auth.logout();
    } else {
      localStorage.removeItem(
        "gamebalance_token"
      );

      localStorage.removeItem(
        "gamebalance_user"
      );
    }

    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* =====================================
          GAMEBALANCE BRAND
      ===================================== */}

      <div className="sidebar-brand">
        <Gamepad2 size={24} />
        <span>GameBalance</span>
      </div>

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <nav>
        {/* DASHBOARD */}
        <NavLink to="/dashboard">
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        {/* GAMING TRACKER */}
        <NavLink to="/gaming">
          <Gamepad2 size={16} />
          Gaming Tracker
        </NavLink>

        {/* STRESS MONITOR */}
        <NavLink to="/stress">
          <Brain size={16} />
          Stress Monitor
        </NavLink>

        {/* SLEEP TRACKER */}
        <NavLink to="/sleep">
          <Moon size={16} />
          Sleep Tracker
        </NavLink>

        {/* RISK REPORTS */}
        <NavLink to="/risk">
          <BarChart3 size={16} />
          Risk Reports
        </NavLink>

        {/* WEEKLY REPORT */}
        <NavLink to="/weekly-report">
          <FileText size={16} />
          Weekly Report
        </NavLink>

        {/* USER PROFILE */}
        <NavLink to="/profile">
          <User size={16} />
          Profile
        </NavLink>

        {/* =====================================
            ADMIN AND SUPER ADMIN
        ===================================== */}

        {[
          "ADMIN",
          "SUPER_ADMIN",
        ].includes(user?.role) && (
          <NavLink to="/admin">
            <Shield size={16} />
            Admin Panel
          </NavLink>
        )}

        {/* =====================================
            SUPER ADMIN - MANAGE ADMINS
        ===================================== */}

        {user?.role === "SUPER_ADMIN" && (
          <NavLink to="/admin/staff">
            <ShieldCheck size={16} />
            Manage Admins
          </NavLink>
        )}

        {/* =====================================
            SUPER ADMIN - MANAGE USERS
        ===================================== */}

        {user?.role === "SUPER_ADMIN" && (
          <NavLink to="/admin/users/manage">
            <Users size={16} />
            Manage Users
          </NavLink>
        )}
      </nav>

      {/* =====================================
          LOGOUT
      ===================================== */}

      <button
        type="button"
        className="logout-btn"
        onClick={handleLogout}
      >
        <LogOut size={17} />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
