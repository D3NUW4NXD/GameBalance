
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const Register = () => {
  const navigate = useNavigate();

  const { register } = useAuth();
  const { notify } = useNotifications();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    city: "",
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

    const fullName = formData.full_name.trim();
    const email = formData.email.trim();
    const age = Number(formData.age);

    if (
      !fullName ||
      !email ||
      !formData.password ||
      !formData.age
    ) {
      notify({
        type: "warning",
        title: "Complete Required Fields",
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

    if (formData.password.length < 6) {
      notify({
        type: "warning",
        title: "Password Too Short",
        duration: 4000,
      });
      return;
    }

    if (
      !Number.isInteger(age) ||
      age < 18 ||
      age > 20
    ) {
      notify({
        type: "warning",
        title: "Age Must Be 18 to 20",
        duration: 4000,
      });
      return;
    }

    if (!formData.gender) {
      notify({
        type: "warning",
        title: "Select Your Gender",
        duration: 4000,
      });
      return;
    }

    try {
      setLoading(true);

      await register({
        full_name: fullName,
        email,
        password: formData.password,
        age,
        gender: formData.gender,
        city: formData.city.trim(),
      });

      // Global notification system displays:
      // Registration Successful

      // The notification remains visible because
      // NotificationProvider wraps the entire app.
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Registration failed:", error);

      // Global notification system displays:
      // Registration Failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="brand">
          <div className="brand-icon">
            <Gamepad2 size={34} />
          </div>

          <h1>GameBalance</h1>

          <p>Create your monitoring account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
          noValidate
        >
          <h2>Register</h2>

          <label htmlFor="register-name">
            Full Name
          </label>

          <input
            id="register-name"
            className="normal-input"
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter full name"
            autoComplete="name"
            required
          />

          <label htmlFor="register-email">
            Email Address
          </label>

          <input
            id="register-email"
            className="normal-input"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">
            Password
          </label>

          <input
            id="register-password"
            className="normal-input"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create password (minimum 6 characters)"
            autoComplete="new-password"
            required
          />

          <div className="form-row">
            <div>
              <label htmlFor="register-age">
                Age
              </label>

              <input
                id="register-age"
                className="normal-input"
                type="number"
                name="age"
                min="18"
                max="20"
                step="1"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="register-gender">
                Gender
              </label>

              <select
                id="register-gender"
                className="normal-input"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>
          </div>

          <label htmlFor="register-city">
            City
          </label>

          <input
            id="register-city"
            className="normal-input"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter your city"
            autoComplete="address-level2"
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

          <p className="auth-link">
            Already registered?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
