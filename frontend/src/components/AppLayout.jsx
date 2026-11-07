
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Gamepad2, Menu, X } from "lucide-react";

import Sidebar from "./Sidebar";
import "../mobile-sidebar.css";
import "../mobile-polish.css";

const AppLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close drawer whenever navigation changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Mobile drawer keyboard and scroll behavior
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    document.querySelector(".gb-drawer-close")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [menuOpen]);

  // Close when a sidebar navigation link or Logout is clicked
  const handleSidebarClick = (event) => {
    if (!menuOpen) return;

    if (
      event.target instanceof Element &&
      event.target.closest(
        ".sidebar nav a, .sidebar .logout-btn"
      )
    ) {
      setMenuOpen(false);
    }
  };

  return (
    <div
      className={`dashboard-page gb-mobile-shell ${
        menuOpen ? "gb-drawer-open" : ""
      }`}
      onClickCapture={handleSidebarClick}
    >
      {/* MOBILE HEADER */}
      <header className="gb-mobile-header">
        <button
          type="button"
          className="gb-menu-toggle"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
        >
          <Menu size={22} />
        </button>

        <div className="gb-header-brand">
          <Gamepad2 size={20} />
          <span>GAMEBALANCE</span>
        </div>
      </header>

      {/* DARK OVERLAY */}
      {menuOpen && (
        <button
          type="button"
          className="gb-drawer-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* YOUR ORIGINAL SIDEBAR */}
      <Sidebar />

      {/* MOBILE CLOSE BUTTON */}
      {menuOpen && (
        <button
          type="button"
          className="gb-drawer-close"
          aria-label="Close sidebar"
          onClick={() => setMenuOpen(false)}
        >
          <X size={20} />
        </button>
      )}

      {/* ORIGINAL PAGE CONTENT */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
