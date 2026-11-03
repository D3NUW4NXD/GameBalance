
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((previous) => !previous);
  };

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

    try {
      setLoading(true);

      await login(email, formData.password);

      // Global notification system displays:
      // Login Successful

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);

      // Global Axios notification system displays:
      // Login Failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo and Branding */}
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

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="auth-form"
          noValidate
        >
          <h2>Login</h2>

          {/* Email Address */}
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

          {/* Password */}
          <label htmlFor="login-password">
            Password
          </label>

          <div className="input-group">
            <Lock size={18} />

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />

            {/* Show / Hide Password */}
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
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
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="forgot-password-container">
            <Link
              to="/forgot-password"
              className="forgot-password-link"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Register Link */}
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
