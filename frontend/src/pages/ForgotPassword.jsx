
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Gamepad2,
  Mail,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import api from "../api/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", {
        email: cleanEmail,
      });

      // Success is shown only when the API responds.
      setSent(true);
    } catch (err) {
      console.error(
        "Password recovery request failed:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to request a password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* GameBalance Branding */}
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

        {sent ? (

          /* Request submitted */
          <div className="auth-form">
            <div className="forgot-success-icon">
              <ShieldCheck size={40} />
            </div>

            <h2>Check Your Email</h2>

            <p className="forgot-description">
              If a GameBalance account exists for
              this email address, you will receive
              a password reset link shortly.
            </p>

            <p className="forgot-email-display">
              {email.trim().toLowerCase()}
            </p>

            <p className="forgot-description">
              Please check your inbox and spam folder.
            </p>

            <p className="auth-link">
              <Link to="/login">
                <ArrowLeft
                  size={16}
                  className="forgot-inline-icon"
                />
                Back to Login
              </Link>
            </p>
          </div>

        ) : (

          /* Forgot Password Form */
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <h2>Forgot Password?</h2>

            <p className="forgot-description">
              No worries! Enter your registered
              email address and we'll send you
              instructions to reset your password.
            </p>

            <label htmlFor="forgot-email">
              Email Address
            </label>

            <div className="input-group">
              <Mail size={18} />

              <input
                id="forgot-email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="Enter your email"
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
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>

            <p className="auth-link">
              <Link to="/login">
                <ArrowLeft
                  size={16}
                  className="forgot-inline-icon"
                />
                Back to Login
              </Link>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
