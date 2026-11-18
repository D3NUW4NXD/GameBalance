
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api/api";
import NotificationToastContainer from "../components/NotificationToastContainer";

const NotificationContext = createContext(null);

const DEFAULT_DURATION = 4000;

// =====================================
// API ACTION NOTIFICATIONS
// =====================================

const getActionNotification = (config, success = true) => {
  if (!config) return null;

  const method = String(config.method || "get").toLowerCase();

  if (!["post", "put", "patch", "delete"].includes(method)) {
    return null;
  }

  let pathname = String(config.url || "");

  try {
    pathname = new URL(pathname, "http://localhost").pathname;
  } catch {
    // Keep original relative path.
  }

  pathname = pathname
    .replace(/^\/api(?=\/|$)/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  const isDelete = method === "delete";
  const isUpdate = method === "put" || method === "patch";

  // Profile handles its own notifications.
  if (
    pathname.startsWith("/auth/profile") ||
    pathname.startsWith("/auth/change-password")
  ) {
    return null;
  }

  // =====================================
  // LOGIN NOTIFICATION
  // =====================================

  if (pathname === "/auth/login") {
    return {
      type: success ? "success" : "danger",
      title: success ? "Login Successful" : "Login Failed",
    };
  }

  // =====================================
  // REGISTER NOTIFICATION
  // =====================================

  if (pathname === "/auth/register") {
    return {
      type: success ? "success" : "danger",
      title: success
        ? "Registration Successful"
        : "Registration Failed",
    };
  }

  // =====================================
  // GAMING TRACKER
  // =====================================

  if (pathname.startsWith("/gaming")) {
    return {
      type: success ? "success" : "danger",
      title: success
        ? isDelete
          ? "Gaming Session Deleted"
          : isUpdate
            ? "Gaming Session Updated"
            : "Gaming Session Saved"
        : "Gaming Action Failed",
    };
  }

  // =====================================
  // STRESS MONITOR
  // =====================================

  if (pathname.startsWith("/stress")) {
    return {
      type: success ? "success" : "danger",
      title: success
        ? isDelete
          ? "Assessment Deleted"
          : "Assessment Completed"
        : "Assessment Failed",
    };
  }

  // =====================================
  // SLEEP TRACKER
  // =====================================

  if (pathname.startsWith("/sleep")) {
    return {
      type: success ? "success" : "danger",
      title: success
        ? isDelete
          ? "Sleep Record Deleted"
          : isUpdate
            ? "Sleep Record Updated"
            : "Sleep Record Saved"
        : "Sleep Action Failed",
    };
  }

  // =====================================
  // RISK ANALYSIS
  // =====================================

  if (pathname.includes("/analysis/generate")) {
    return {
      type: success ? "success" : "danger",
      title: success
        ? "Risk Analysis Generated"
        : "Risk Analysis Failed",
    };
  }

  // =====================================
  // ADMIN ACTIONS
  // =====================================

  if (pathname.startsWith("/admin")) {
    return {
      type: success ? "success" : "danger",
      title: success
        ? "Admin Changes Saved"
        : "Admin Action Failed",
    };
  }

  // =====================================
  // OTHER ACTIONS
  // =====================================

  return {
    type: success ? "success" : "danger",
    title: success
      ? isDelete
        ? "Item Deleted"
        : "Changes Saved"
      : "Action Failed",
  };
};

// =====================================
// WELLNESS ALERT HELPERS
// =====================================

const getAlertType = (alert) => {
  const level = [
    alert.risk_level,
    alert.severity,
    alert.alert_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (
    level.includes("HIGH") ||
    level.includes("CRITICAL") ||
    level.includes("DANGER")
  ) {
    return "danger";
  }

  if (
    level.includes("MODERATE") ||
    level.includes("WARNING")
  ) {
    return "warning";
  }

  if (
    level.includes("LOW") ||
    level.includes("SAFE")
  ) {
    return "success";
  }

  return "info";
};

const getAlertTitle = (alert) => {
  const level = [
    alert.risk_level,
    alert.severity,
    alert.alert_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (
    level.includes("HIGH") ||
    level.includes("CRITICAL")
  ) {
    return "High Risk Detected";
  }

  if (level.includes("MODERATE")) {
    return "Moderate Risk Detected";
  }

  if (level.includes("LOW")) {
    return "Wellness Update";
  }

  return "New Wellness Alert";
};

const getAlertId = (alert) => {
  return String(
    alert.alert_id ??
      alert.id ??
      `${alert.created_at || ""}-${alert.alert_message || alert.message || ""}`
  );
};

const getCurrentUserId = () => {
  try {
    const savedUser = JSON.parse(
      localStorage.getItem("gamebalance_user") || "null"
    );

    return savedUser?.user_id || savedUser?.id || null;
  } catch {
    return null;
  }
};

// =====================================
// NOTIFICATION PROVIDER
// =====================================

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const timersRef = useRef(new Map());
  const recentlyShownRef = useRef(new Map());
  const fetchingAlertsRef = useRef(false);

  // =====================================
  // REMOVE NOTIFICATION
  // =====================================

  const removeNotification = useCallback((id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );

    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // =====================================
  // CREATE NOTIFICATION
  // =====================================

  const notify = useCallback(
    ({
      title = "GameBalance Notification",
      type = "info",
      duration = DEFAULT_DURATION,
      sourceId = null,
    } = {}) => {
      const now = Date.now();
      const notificationKey = `${type}:${title}`;

      const lastShown =
        recentlyShownRef.current.get(notificationKey) || 0;

      // Avoid duplicate notifications.
      if (now - lastShown < 1200) {
        return null;
      }

      recentlyShownRef.current.set(
        notificationKey,
        now
      );

      const id = `${now}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      const validDuration =
        Number.isFinite(duration) && duration > 0
          ? duration
          : DEFAULT_DURATION;

      const notification = {
        id,
        title,
        type,
        duration: validDuration,
        sourceId,
      };

      setNotifications((current) =>
        [...current, notification].slice(-4)
      );

      const timer = setTimeout(() => {
        removeNotification(id);
      }, validDuration);

      timersRef.current.set(id, timer);

      return id;
    },
    [removeNotification]
  );

  // =====================================
  // CLEAR ALL NOTIFICATIONS
  // =====================================

  const clearNotifications = useCallback(() => {
    timersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });

    timersRef.current.clear();
    setNotifications([]);
  }, []);

  // =====================================
  // AUTOMATIC API NOTIFICATIONS
  // =====================================

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      // SUCCESS RESPONSE
      (response) => {
        if (response.config?.toast === false) {
          return response;
        }

        const successful =
          response.data?.success !== false;

        const notification = getActionNotification(
          response.config,
          successful
        );

        if (notification) {
          notify(notification);
        }

        return response;
      },

      // ERROR RESPONSE
      (error) => {
        // =====================================
        // NEW: BANNED ACCOUNT LOGIN
        // =====================================
        //
        // Backend verifies the password before
        // returning ACCOUNT_BANNED.
        //
        // Login.jsx displays the suspension
        // reason and countdown itself.
        //
        // Prevent the generic "Login Failed"
        // toast only for this specific response.
        // =====================================

        const isBannedLogin =
          error.response?.status === 403 &&
          error.response?.data?.code ===
            "ACCOUNT_BANNED";

        if (isBannedLogin) {
          return Promise.reject(error);
        }

        // =====================================
        // NORMAL ERROR NOTIFICATIONS
        // =====================================

        if (error.config?.toast !== false) {
          const notification = getActionNotification(
            error.config,
            false
          );

          if (notification) {
            notify(notification);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [notify]);

  // =====================================
  // FETCH BACKEND WELLNESS ALERTS
  // =====================================

  const fetchBackendAlerts = useCallback(async () => {
    const token = localStorage.getItem(
      "gamebalance_token"
    );

    const userId = getCurrentUserId();

    if (
      !token ||
      !userId ||
      fetchingAlertsRef.current
    ) {
      return;
    }

    fetchingAlertsRef.current = true;

    try {
      const response = await api.get(
        "/analysis/alerts",
        {
          toast: false,
        }
      );

      const alerts =
        response.data?.alerts ||
        response.data?.data?.alerts ||
        [];

      if (
        !Array.isArray(alerts) ||
        alerts.length === 0
      ) {
        return;
      }

      // Prevent alerts from appearing for
      // another user after account switching.
      if (
        token !== localStorage.getItem(
          "gamebalance_token"
        ) ||
        userId !== getCurrentUserId()
      ) {
        return;
      }

      // =====================================
      // TRACK SEEN ALERTS
      // =====================================

      const storageKey =
        `gamebalance_seen_alerts_${userId}`;

      let seenIds = [];

      try {
        const saved = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        );

        seenIds = Array.isArray(saved)
          ? saved
          : [];
      } catch {
        seenIds = [];
      }

      const seenSet = new Set(
        seenIds.map(String)
      );

      const sortedAlerts = [...alerts].sort(
        (a, b) => {
          return (
            new Date(
              b.created_at || 0
            ).getTime() -
            new Date(
              a.created_at || 0
            ).getTime()
          );
        }
      );

      const unseenAlerts = sortedAlerts.filter(
        (alert) =>
          !seenSet.has(getAlertId(alert))
      );

      // =====================================
      // SHOW NEW ALERTS
      // =====================================

      unseenAlerts.slice(0, 3).forEach(
        (alert) => {
          notify({
            type: getAlertType(alert),
            title: getAlertTitle(alert),
            duration: 5000,
            sourceId: getAlertId(alert),
          });
        }
      );

      // =====================================
      // SAVE SEEN ALERT IDS
      // =====================================

      unseenAlerts.forEach((alert) => {
        seenSet.add(getAlertId(alert));
      });

      localStorage.setItem(
        storageKey,
        JSON.stringify(
          Array.from(seenSet).slice(-150)
        )
      );

    } catch (error) {
      // Don't show a popup repeatedly
      // when the alerts API is unavailable.
      console.error(
        "Unable to load wellness alerts:",
        error
      );

    } finally {
      fetchingAlertsRef.current = false;
    }
  }, [notify]);

  // =====================================
  // REFRESH ALERTS EVERY 30 SECONDS
  // =====================================

  useEffect(() => {
    fetchBackendAlerts();

    const interval = setInterval(() => {
      fetchBackendAlerts();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchBackendAlerts]);

  // =====================================
  // REFRESH WHEN TAB BECOMES VISIBLE
  // =====================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        fetchBackendAlerts();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [fetchBackendAlerts]);

  // =====================================
  // CLEANUP NOTIFICATION TIMERS
  // =====================================

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer);
      });

      timers.clear();
    };
  }, []);

  // =====================================
  // PROVIDER
  // =====================================

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notify,
        addNotification: notify,
        removeNotification,
        clearNotifications,
        refreshAlerts: fetchBackendAlerts,
      }}
    >
      {children}

      <NotificationToastContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

// =====================================
// USE NOTIFICATIONS HOOK
// =====================================

export const useNotifications = () => {
  const context = useContext(
    NotificationContext
  );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
};
