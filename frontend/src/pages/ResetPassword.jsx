
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Gamepad2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import api from "../api/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!/^[a-f0-9]{64}$/.test(token)) {
      setError(
        "Invalid reset link. Please request a new one."
      );
      return;
    }

    const { newPassword, confirmPassword } = formData;

    if (
      newPassword.length < 8 ||
      new TextEncoder().encode(newPassword).length > 72
    ) {
      setError(
        "Password must be at least 8 characters and no more than 72 UTF-8 bytes."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);

      setFormData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Branding */}
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

        {success ? (
          <div className="auth-form">

            <div className="reset-success-icon">
              <CheckCircle2 size={44} />
            </div>

            <h2>Password Reset Successful!</h2>

            <p className="reset-description">
              Your password has been updated
              successfully. You can now log in
              using your new password.
            </p>

            <p className="auth-link">
              <Link to="/login">
                Back to Login
              </Link>
            </p>

          </div>
        ) : (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <h2>Reset Password</h2>

            <p className="reset-description">
              Enter your new password below
              to recover your GameBalance account.
            </p>

            {/* Invalid token */}
            {!/^[a-f0-9]{64}$/.test(token) && (
              <p className="error-box" role="alert">
                This reset link is invalid.
                Please request a new one.
              </p>
            )}

            {/* New Password */}
            <label htmlFor="new-password">
              New Password
            </label>

            <div className="input-group reset-input-group">
              <Lock size={18} />

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className="reset-eye-button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword
                    ? "Hide new password"
                    : "Show new password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <label htmlFor="confirm-password">
              Confirm Password
            </label>

            <div className="input-group reset-input-group">
              <Lock size={18} />

              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className="reset-eye-button"
                onClick={() =>
                  setShowConfirm((previous) => !previous)
                }
                aria-label={
                  showConfirm
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
              >
                {showConfirm ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>

            {/* Back to Login */}
            <p className="auth-link">
              <Link to="/login">
                <ArrowLeft
                  size={16}
                  style={{
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: 5,
                  }}
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

export default ResetPassword;
