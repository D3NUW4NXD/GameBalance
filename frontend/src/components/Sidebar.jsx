import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  Brain,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const auth = useAuth();
  const user = auth.user;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const menuToggleRef = useRef(null);

  // Keep the mobile menu closed after navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent scrolling behind the drawer, and allow Escape to close it.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    if (window.innerWidth <= 900) menuToggleRef.current?.focus();
  };

  const handleLogout = () => {
    closeMenu();

    if (auth.logout) {
      auth.logout();
    } else {
      localStorage.removeItem("gamebalance_token");
      localStorage.removeItem("gamebalance_user");
    }

    navigate("/login");
  };

  return (
    <>
      {/* Shown only on phone and tablet screens. */}
      <header className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <Gamepad2 size={24} aria-hidden="true" />
          <span>GameBalance</span>
        </div>

        <button
          type="button"
          ref={menuToggleRef}
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="gamebalance-sidebar"
        >
          <Menu size={23} aria-hidden="true" />
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          onClick={closeMenu}
          aria-label="Close navigation menu"
          tabIndex={-1}
        />
      )}

      <aside
        id="gamebalance-sidebar"
        className={`sidebar${menuOpen ? " sidebar--open" : ""}`}
        aria-label="GameBalance navigation"
      >
        <div className="sidebar-brand">
          <Gamepad2 size={24} aria-hidden="true" />
          <span>GameBalance</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="mobile-sidebar-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main navigation">
          <NavLink to="/dashboard" onClick={closeMenu}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <NavLink to="/gaming" onClick={closeMenu}>
            <Gamepad2 size={16} />
            Gaming Tracker
          </NavLink>

          <NavLink to="/stress" onClick={closeMenu}>
            <Brain size={16} />
            Stress Monitor
          </NavLink>

          <NavLink to="/sleep" onClick={closeMenu}>
            <Moon size={16} />
            Sleep Tracker
          </NavLink>

          <NavLink to="/risk" onClick={closeMenu}>
            <BarChart3 size={16} />
            Risk Reports
          </NavLink>

          <NavLink to="/weekly-report" onClick={closeMenu}>
            <FileText size={16} />
            Weekly Report
          </NavLink>

          <NavLink to="/profile" onClick={closeMenu}>
            <User size={16} />
            Profile
          </NavLink>

          {user?.role === "ADMIN" && (
            <NavLink to="/admin" onClick={closeMenu}>
              <Shield size={16} />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          <LogOut size={17} aria-hidden="true" />
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
