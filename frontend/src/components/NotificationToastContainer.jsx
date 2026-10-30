
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";

const getIcon = (type) => {
  switch (type) {
    case "success":
      return <CheckCircle2 size={20} />;

    case "warning":
      return <AlertTriangle size={20} />;

    case "danger":
      return <ShieldAlert size={20} />;

    default:
      return <Info size={20} />;
  }
};

const NotificationToastContainer = ({
  notifications,
  removeNotification,
}) => {
  return (
    <div className="gb-toast-stack" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`gb-toast gb-toast-${notification.type}`}
          role={
            notification.type === "danger"
              ? "alert"
              : "status"
          }
          style={{
            "--toast-duration": `${notification.duration}ms`,
          }}
        >
          <div className="gb-toast-icon">
            {getIcon(notification.type)}
          </div>

          <h4>{notification.title}</h4>

          <button
            type="button"
            className="gb-toast-close"
            onClick={() =>
              removeNotification(notification.id)
            }
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToastContainer;
