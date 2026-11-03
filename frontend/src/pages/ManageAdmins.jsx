
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import api from "../api/api";

const ManageAdmins = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  // Load all registered users.
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Create a new ADMIN account.
  const createAdmin = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.post("/admin/staff", {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setForm({
        full_name: "",
        email: "",
        password: "",
      });

      setNotice(
        "New ADMIN account created. Share its initial password securely."
      );

      await refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not create admin"
      );
    } finally {
      setBusy(false);
    }
  };

  // Promote or demote an existing account.
  const setRole = async (user, role) => {
    const verb =
      role === "ADMIN"
        ? "promote to ADMIN"
        : "remove ADMIN access from";

    const confirmed = window.confirm(
      `Are you sure you want to ${verb} ${user.full_name}?`
    );

    if (!confirmed) return;

    setBusy(true);
    setNotice("");
    setError("");

    try {
      await api.patch(
        `/admin/users/${user.user_id}/role`,
        { role }
      );

      setNotice(
        `${user.full_name}: role updated to ${role}`
      );

      await refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not change role"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="module-page staff-page">

      {/* Header */}
      <div className="module-header">
        <div>
          <span className="staff-eyebrow">
            <ShieldCheck size={17} />
            SUPER ADMIN CONTROL
          </span>

          <h1>Admin Management</h1>

          <p>
            Create admin accounts and manage
            access to the admin dashboard.
          </p>
        </div>

        <Link
          to="/admin"
          className="staff-back-link"
        >
          Back to Admin Dashboard
        </Link>
      </div>

      {/* Status Messages */}
      {error && (
        <p
          className="staff-message staff-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          className="staff-message staff-success"
          role="status"
        >
          {notice}
        </p>
      )}

      {/* Create Admin */}
      <section className="staff-panel">
        <h2>
          <UserPlus size={20} />
          Create New Admin
        </h2>

        <p>
          New accounts receive ADMIN permissions,
          not SUPER_ADMIN permissions.
        </p>

        <form
          className="staff-form"
          onSubmit={createAdmin}
        >
          <label htmlFor="staff-name">
            Full Name
          </label>

          <input
            id="staff-name"
            value={form.full_name}
            required
            minLength={2}
            maxLength={100}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
          />

          <label htmlFor="staff-email">
            Email Address
          </label>

          <input
            id="staff-email"
            type="email"
            autoComplete="off"
            value={form.email}
            required
            maxLength={254}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <label htmlFor="staff-password">
            Initial Password (12+ characters)
          </label>

          <input
            id="staff-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            required
            minLength={12}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <button
            type="submit"
            disabled={busy}
          >
            {busy ? "Working..." : "Create Admin"}
          </button>
        </form>

        <p className="staff-hint">
          If someone already has a GameBalance
          account, promote them below instead.
        </p>
      </section>

      {/* Account Management */}
      <section className="staff-panel">
        <div className="staff-title-row">
          <h2>Account Roles</h2>

          <button
            type="button"
            className="staff-refresh"
            onClick={refresh}
            disabled={busy || loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading accounts...</p>
        ) : (
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.full_name}</td>

                    <td>{user.email}</td>

                    <td>
                      <span className="staff-role">
                        {user.role}
                      </span>
                    </td>

                    <td>
                      {user.role === "SUPER_ADMIN" ? (
                        <span className="staff-protected">
                          Protected
                        </span>
                      ) : user.role === "ADMIN" ? (
                        <button
                          type="button"
                          className="staff-demote"
                          disabled={busy}
                          onClick={() =>
                            setRole(user, "USER")
                          }
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setRole(user, "ADMIN")
                          }
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ManageAdmins;
