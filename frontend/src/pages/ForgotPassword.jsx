
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  Gamepad2,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../api/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState("request");

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================
  // REQUEST EMAIL CODE
  // =====================================

  const requestCode = async (event) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      const response = await api.post(
        "/auth/password/request-reset",
        { email: cleanEmail }
      );

      setEmail(cleanEmail);

      setMessage(
        response.data.message ||
        "If this account exists, check your email for a code."
      );

      setStage("verify");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not request a code. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // VERIFY CODE AND RESET PASSWORD
  // =====================================

  const confirmReset = async (event) => {
    event.preventDefault();
    if (busy) return;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.post(
        "/auth/password/confirm-reset",
        {
          email,
          code,
          new_password: newPassword,
        }
      );

      setCode("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password reset successfully. Log in with your new password."
      );

      setStage("complete");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Code invalid or expired. Request another code."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* GAMEBALANCE BRANDING */}
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

        {/* =====================================
            PASSWORD RESET COMPLETE
        ===================================== */}

        {stage === "complete" ? (
          <div className="auth-form">

            <ShieldCheck
              size={40}
              color="#22c55e"
            />

            <h2>Password Reset</h2>

            <p className="success-box" role="status">
              {message}
            </p>

            <p className="auth-link">
              <Link to="/login">
                Back to Login
              </Link>
            </p>
          </div>

        ) : stage === "request" ? (

          /* =====================================
             ENTER EMAIL
          ===================================== */

          <form
            className="auth-form"
            onSubmit={requestCode}
          >
            <h2>Forgot Password?</h2>

            <p className="forgot-description">
              Enter your registered email address
              to request a six-digit code.
            </p>

            <label htmlFor="forgot-email">
              Email Address
            </label>

            <div className="input-group">
              <Mail size={18} />

              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Your email address"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Sending..."
                : "Send Verification Code"}
            </button>

            <p className="auth-link">
              <Link to="/login">
                Back to Login
              </Link>
            </p>
          </form>

        ) : (

          /* =====================================
             ENTER CODE AND NEW PASSWORD
          ===================================== */

          <form
            className="auth-form"
            onSubmit={confirmReset}
          >
            <h2>Verify Email Code</h2>

            <p className="forgot-description">
              {message}
            </p>

            <p className="forgot-email-display">
              {email}
            </p>

            {/* SIX-DIGIT CODE */}
            <label htmlFor="reset-code">
              Six-Digit Code
            </label>

            <div className="input-group">
              <ShieldCheck size={18} />

              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="123456"
                required
              />
            </div>

            {/* NEW PASSWORD */}
            <label htmlFor="reset-password">
              New Password (10+ characters)
            </label>

            <div className="input-group login-password-group">
              <Lock size={18} />

              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                minLength={10}
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
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

            {/* CONFIRM NEW PASSWORD */}
            <label htmlFor="reset-confirm">
              Confirm New Password
            </label>

            <div className="input-group">
              <Lock size={18} />

              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
              />
            </div>

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Verifying..."
                : "Reset Password"}
            </button>

            <p className="auth-link">
              <button
                type="button"
                onClick={() => {
                  setStage("request");
                  setError("");
                }}
                style={{
                  width: "auto",
                  height: "auto",
                  margin: 0,
                  padding: 0,
                  background: "none",
                  border: 0,
                  boxShadow: "none",
                  color: "#ff8295",
                  cursor: "pointer",
                  fontSize: 14,
                  textTransform: "none",
                }}
              >
                Request another code
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
