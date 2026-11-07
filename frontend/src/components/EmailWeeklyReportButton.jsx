
import { useState } from "react";
import { Mail } from "lucide-react";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const EmailWeeklyReportButton = ({ disabled = false }) => {
  const { notify } = useNotifications();

  const [sending, setSending] = useState(false);

  // =====================================
  // EMAIL WEEKLY WELLNESS REPORT
  // =====================================

  const sendReport = async () => {
    if (sending || disabled) return;

    setSending(true);

    try {
      const response = await api.post(
        "/analysis/weekly-report/email",
        {},
        { toast: false }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
          "Unable to request weekly report email."
        );
      }

      // Show a floating success notification.
      // The API accepted the request; delivery
      // may still take a moment.
      notify({
        type: "success",
        title: "Weekly Report Email Requested",
        duration: 4500,
      });

    } catch (error) {
      console.error(
        "Weekly report email error:",
        error
      );

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to request report email.";

      const isRateLimited =
        error.response?.status === 429;

      notify({
        type: isRateLimited ? "warning" : "danger",
        title: errorMessage,
        duration: 5500,
      });

    } finally {
      setSending(false);
    }
  };

  // =====================================
  // EMAIL BUTTON
  // =====================================

  return (
    <div className="weekly-email-action">
      <button
        type="button"
        className="back-link"
        onClick={sendReport}
        disabled={sending || disabled}
        aria-busy={sending}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          margin: 0,
          cursor:
            sending || disabled
              ? "not-allowed"
              : "pointer",
          opacity:
            sending || disabled
              ? 0.6
              : 1,
        }}
      >
        <Mail size={17} />

        {sending
          ? "Sending..."
          : "Email Report"}
      </button>
    </div>
  );
};

export default EmailWeeklyReportButton;
