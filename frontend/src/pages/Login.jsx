
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gamepad2, Lock, Mail } from "lucide-react";

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
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

      // Login Successful notification
      // is handled by your global system.

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

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

        <form
          onSubmit={handleSubmit}
          className="auth-form"
          noValidate
        >
          <h2>Login</h2>

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

          <label htmlFor="login-password">
            Password
          </label>

          <div className="input-group">
            <Lock size={18} />

            <input
              id="login-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="forgot-password-row">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

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
