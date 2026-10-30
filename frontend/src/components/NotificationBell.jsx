
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const getAlertStyle = (severity) => {
  const level = String(severity || "").toUpperCase();

  if (level === "HIGH" || level === "CRITICAL") {
    return "danger";
  }

  if (level === "MODERATE" || level === "WARNING") {
    return "warning";
  }

  return "info";
};

const NotificationBell = () => {
  const { notify } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const containerRef = useRef(null);

  // Fetch notifications from MySQL through the backend.
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get("/analysis/alerts");

      const items = response.data?.alerts || [];

      setAlerts(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  // Load notifications and refresh every 30 seconds.
  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close notification panel when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const unreadCount = alerts.filter(
    (alert) => Number(alert.is_read) === 0
  ).length;

  // Mark one notification as read.
  const markAsRead = async (alertId) => {
    if (updatingId !== null) return;

    try {
      setUpdatingId(alertId);

      await api.put(`/analysis/alerts/${alertId}/read`);

      setAlerts((current) =>
        current.map((alert) =>
          alert.alert_id === alertId
            ? { ...alert, is_read: 1 }
            : alert
        )
      );
    } catch (error) {
      console.error("Failed to mark notification:", error);

      notify({
        type: "danger",
        title: "Notification Update Failed",
        duration: 4000,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Mark all notifications as read.
  const markAllAsRead = async () => {
    if (loading || unreadCount === 0) return;

    try {
      setLoading(true);

      await api.put("/analysis/alerts/read-all");

      setAlerts((current) =>
        current.map((alert) => ({
          ...alert,
          is_read: 1,
        }))
      );

      notify({
        type: "success",
        title: "Notifications Marked Read",
        duration: 4000,
      });
    } catch (error) {
      console.error("Failed to mark all notifications:", error);

      notify({
        type: "danger",
        title: "Notification Update Failed",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gb-bell-container" ref={containerRef}>
      {/* Notification bell button */}

      <button
        type="button"
        className="gb-bell-trigger"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);

          if (!isOpen) {
            fetchAlerts();
          }
        }}
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="gb-bell-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}

      {isOpen && (
        <div className="gb-bell-dropdown">
          <div className="gb-bell-header">
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount} unread</p>
            </div>

            <button
              type="button"
              className="gb-bell-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          <div className="gb-bell-toolbar">
            <span>Recent Alerts</span>

            <button
              type="button"
              disabled={loading || unreadCount === 0}
              onClick={markAllAsRead}
            >
              <CheckCheck size={14} />
              Mark All Read
            </button>
          </div>

          <div className="gb-bell-list">
            {alerts.length === 0 ? (
              <div className="gb-bell-empty">
                <Bell size={25} />
                <p>No notifications yet</p>
              </div>
            ) : (
              alerts.slice(0, 20).map((alert) => {
                const unread =
                  Number(alert.is_read) === 0;

                const style = getAlertStyle(
                  alert.severity
                );

                return (
                  <div
                    key={alert.alert_id}
                    className={`gb-bell-alert ${
                      unread ? "unread" : ""
                    }`}
                  >
                    <div
                      className={`gb-bell-dot ${style}`}
                    />

                    <div className="gb-bell-alert-content">
                      <div className="gb-bell-alert-top">
                        <strong>
                          {alert.alert_type ||
                            "Wellness Alert"}
                        </strong>

                        {unread && (
                          <span className="gb-bell-new">
                            NEW
                          </span>
                        )}
                      </div>

                      <p>{alert.alert_message}</p>

                      <small>
                        {alert.created_at
                          ? new Date(
                              alert.created_at
                            ).toLocaleString()
                          : ""}
                      </small>
                    </div>

                    {unread && (
                      <button
                        type="button"
                        className="gb-bell-read"
                        disabled={updatingId !== null}
                        onClick={() =>
                          markAsRead(alert.alert_id)
                        }
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
