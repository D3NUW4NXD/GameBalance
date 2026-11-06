
import { useState } from "react";
import { Mail } from "lucide-react";
import api from "../api/api";

const EmailWeeklyReportButton = ({ disabled = false }) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const sendReport = async () => {
    if (sending || disabled) return;

    setSending(true);
    setMessage("");

    try {
      const response = await api.post(
        "/analysis/weekly-report/email",
        {}
      );

      setSuccess(true);
      setMessage(
        response.data.message ||
        "Report email request accepted!"
      );
    } catch (error) {
      setSuccess(false);
      setMessage(
        error.response?.data?.message ||
        "Failed to send report email."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="weekly-email-action">
      <button
        type="button"
        className="back-link"
        onClick={sendReport}
        disabled={sending || disabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          cursor: sending || disabled
            ? "not-allowed"
            : "pointer",
          opacity: sending || disabled ? 0.6 : 1,
          marginBottom: "18px",
        }}
      >
        <Mail size={18} />
        {sending ? "Sending..." : "Email Report"}
      </button>

      {message && (
        <div
          className={
            success ? "success-box" : "error-box"
          }
          role={success ? "status" : "alert"}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default EmailWeeklyReportButton;
