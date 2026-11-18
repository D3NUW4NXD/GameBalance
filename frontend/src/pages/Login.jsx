
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Gamepad2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock3,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

// Convert remaining seconds into a readable countdown.
const formatRemaining = (value) => {
  const total = Math.max(
    0,
    Math.floor(Number(value) || 0)
  );

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pair = (number) =>
    String(number).padStart(2, "0");

  return days > 0
    ? `${days}d ${pair(hours)}h ${pair(minutes)}m ${pair(seconds)}s`
    : `${pair(hours)}:${pair(minutes)}:${pair(seconds)}`;
};

const Login = () => {
  const navigate = useNavigate();

  const { login } = useAuth();
  const { notify } = useNotifications();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Ban information returned by the backend.
  const [ban, setBan] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // =====================================
  // LIVE BAN COUNTDOWN
  // =====================================

  useEffect(() => {
    if (!ban || ban.type !== "TEMPORARY") return;

    // Count down from the remaining time calculated by MySQL.
    const deadline =
      Date.now() +
      Math.max(
        0,
        Number(ban.remaining_seconds) || 0
      ) * 1000;

    const tick = () => {
      setSecondsLeft(
        Math.max(
          0,
          Math.ceil((deadline - Date.now()) / 1000)
        )
      );
    };

    tick();

    const interval = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [ban]);

  // =====================================
  // INPUT CHANGE
  // =====================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // A new login attempt should fetch fresh ban details.
    setBan(null);
  };

  // =====================================
  // LOGIN
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const email = formData.email.trim();

    if (!email || !formData.password) {
      notify({
        type: "warning",
        title: "Enter Email and Password",
        duration: 4000,
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify({
        type: "warning",
        title: "Invalid Email Address",
        duration: 4000,
      });
      return;
    }

    setBan(null);

    try {
      setLoading(true);

      await login(email, formData.password);

      navigate("/dashboard", {
        replace: true,
      });

    } catch (error) {
      const data = error.response?.data;

      if (
        error.response?.status === 403 &&
        data?.code === "ACCOUNT_BANNED" &&
        data.ban
      ) {
        // Show the ban panel instead of a generic error.
        setSecondsLeft(
          Math.max(
            0,
            Number(data.ban.remaining_seconds) || 0
          )
        );
        setBan(data.ban);
      } else {
        console.error(
          "Login request failed. Status:",
          error.response?.status ?? "network error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Display the actual expiry time in UTC.
  const expiresOn = ban?.expires_at_utc
    ? new Date(ban.expires_at_utc)
    : null;

  const expiryLabel =
    expiresOn &&
    !Number.isNaN(expiresOn.getTime())
      ? expiresOn.toUTCString()
      : "Not available";

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* BRANDING */}
        <div className="brand">
          <div className="brand-icon">
            <Gamepad2 size={34} />
          </div>

          <h1>GameBalance</h1>

          <p>
            Gaming Behavior and Stress Level
            Monitoring System
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="auth-form"
          noValidate
        >
          <h2>Login</h2>

          {/* EMAIL */}
          <label htmlFor="login-email">
            Email Address
          </label>

          <div className="input-group">
            <Mail size={18} />

            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              autoComplete="email"
              required
            />
          </div>

          {/* PASSWORD */}
          <label htmlFor="login-password">
            Password
          </label>

          <div className="input-group login-password-group">
            <Lock size={18} />

            <input
              id="login-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="login-password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-pressed={showPassword}
              title={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {/* =====================================
              ACCOUNT SUSPENSION PANEL
          ===================================== */}

          {ban && (
            <section
              role="alert"
              style={{
                background: "rgba(188, 28, 58, .13)",
                border:
                  "1px solid rgba(255, 86, 116, .55)",
                borderRadius: 12,
                padding: 16,
                margin: "16px 0",
                color: "#f6edf0",
                overflowWrap: "anywhere",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <ShieldAlert
                  size={20}
                  color="#ff6684"
                />

                <strong
                  style={{
                    color: "#ff8198",
                    fontSize: 16,
                  }}
                >
                  Account Suspended
                </strong>
              </div>

              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginTop: 10,
                }}
              >
                {ban.type === "PERMANENT"
                  ? "Your GameBalance account has been permanently suspended."
                  : "Your GameBalance account is temporarily suspended."}
              </p>

              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <strong>Reason:</strong>{" "}
                {ban.reason || "No reason provided."}
              </p>

              {/* TEMPORARY BAN */}
              {ban.type === "TEMPORARY" && (
                <div
                  style={{
                    background: "rgba(0,0,0,.23)",
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      alignItems: "center",
                    }}
                  >
                    <Clock3
                      size={17}
                      color="#ff8198"
                    />

                    <span style={{ fontSize: 12 }}>
                      Time Remaining
                    </span>
                  </div>

                  <strong
                    style={{
                      display: "block",
                      fontSize: 25,
                      margin: "8px 0",
                      fontVariantNumeric: "tabular-nums",
                      color: "#ff879b",
                    }}
                  >
                    {formatRemaining(secondsLeft)}
                  </strong>

                  <p
                    style={{
                      fontSize: 12,
                      margin: 0,
                    }}
                  >
                    Ban ends: {expiryLabel}
                  </p>

                  {secondsLeft === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        marginBottom: 0,
                      }}
                    >
                      The suspension time has elapsed.
                      Try logging in again.
                    </p>
                  )}
                </div>
              )}

              {/* PERMANENT BAN */}
              {ban.type === "PERMANENT" && (
                <p
                  style={{
                    color: "#ffadbf",
                    fontWeight: 600,
                  }}
                >
                  Duration: Permanent — no scheduled expiry.
                </p>
              )}

              <p
                style={{
                  fontSize: 12,
                  marginBottom: 0,
                }}
              >
                If you believe this is a mistake,
                contact GameBalance support.
              </p>
            </section>
          )}

          {/* FORGOT PASSWORD */}
          <div className="forgot-password-row">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* REGISTER */}
          <p className="auth-link">
            New user?{" "}
            <Link to="/register">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
