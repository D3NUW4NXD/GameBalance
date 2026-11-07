
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Gamepad2, Menu, X } from "lucide-react";

import Sidebar from "./Sidebar";

const AppLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const location = useLocation();

  // Close the sidebar when the page changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background scrolling while the
  // mobile sidebar is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [mobileMenuOpen]);

  // Close the menu when clicking an existing
  // sidebar link or the Logout button.
  // No modifications to Sidebar.jsx required.
  const handleNavigationClick = (event) => {
    if (!mobileMenuOpen) return;

    const clickedNavigation =
      event.target.closest?.(
        ".sidebar nav a, .sidebar .logout-btn"
      );

    if (clickedNavigation) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div
      className={`dashboard-page gb-app-shell ${
        mobileMenuOpen ? "gb-menu-open" : ""
      }`}
      onClickCapture={handleNavigationClick}
    >
      {/* MOBILE HEADER */}
      <header className="gb-mobile-bar">
        <button
          type="button"
          className="gb-mobile-menu-button"
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={22} />
        </button>

        <div className="gb-mobile-brand">
          <Gamepad2 size={20} />
          <span>GameBalance</span>
        </div>
      </header>

      {/* DARK MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="gb-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ORIGINAL SIDEBAR - UNCHANGED */}
      <Sidebar />

      {/* MOBILE CLOSE BUTTON */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="gb-mobile-close"
          aria-label="Close sidebar"
          onClick={() => setMobileMenuOpen(false)}
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
