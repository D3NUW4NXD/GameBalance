import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ShieldCheck,
  RefreshCw,
  UserPlus,
  Search,
} from "lucide-react";

import api from "../api/api";

// =====================================
// HELPERS
// =====================================

const readError = (error) =>
  error.response?.data?.message ||
  "Request failed. Check your connection or Netlify logs.";

const initialForm = {
  full_name: "",
  email: "",
  password: "",
};

// =====================================
// MANAGE USERS PAGE
// =====================================

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // =====================================
  // LOAD ALL USERS
  // =====================================

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get(
        "/admin/manage-users"
      );

      setUsers(data.users || []);
      setError("");
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // =====================================
  // SEARCH USERS
  // =====================================

  const visible = useMemo(
    () =>
      users.filter((user) =>
        `${user.full_name} ${user.email} ${user.role} ${user.account_status}`
          .toLowerCase()
          .includes(filter.toLowerCase().trim())
      ),
    [users, filter]
  );

  // =====================================
  // CREATE USER
  // =====================================

  const create = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data } = await api.post(
        "/admin/manage-users",
        {
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }
      );

      setForm(initialForm);
      setNotice(data.message);

      await refresh();
    } catch (err) {
      setError(readError(err));
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // BAN OR UNBAN USER
  // =====================================

  const ban = async (user, action, hours) => {
    if (busy) return;

    let reason = "";

    if (action !== "UNBAN") {
      const input = window.prompt(
        `Reason for ${action.toLowerCase()} ban of ${user.email}:`
      );

      if (input === null) return;

      reason = input.trim();

      if (reason.length < 3) {
        setError(
          "Please enter a reason of at least 3 characters."
        );
        return;
      }
    }

    const confirmed = window.confirm(
      `${
        action === "UNBAN"
          ? "Unban"
          : "Apply " + action.toLowerCase() + " ban to"
      } ${user.email}?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data } = await api.patch(
        `/admin/manage-users/${user.user_id}/ban`,
        {
          action,
          hours,
          reason,
        }
      );

      setNotice(data.message);

      await refresh();
    } catch (err) {
      setError(readError(err));
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // PERMANENTLY DELETE USER
  // =====================================

  const remove = async (user) => {
    if (busy) return;

    const typed = window.prompt(
      `PERMANENT DELETE: type the full email ${user.email} to confirm:`
    );

    if (
      typed === null ||
      typed.trim().toLowerCase() !==
        user.email.toLowerCase()
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${user.email} and their stored wellness records permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data } = await api.delete(
        `/admin/manage-users/${user.user_id}`,
        {
          data: {
            confirm_email: typed,
          },
        }
      );

      setNotice(data.message);

      await refresh();
    } catch (err) {
      setError(readError(err));
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // PAGE UI
  // =====================================

  return (
    <div className="module-page staff-page">

      {/* HEADER */}
      <div className="module-header">
        <div>
          <span className="staff-eyebrow">
            <ShieldCheck size={17} />
            SUPER ADMIN CONTROL
          </span>

          <h1>User Management</h1>

          <p>
            Add users, review accounts, and manage
            temporary or permanent bans.
          </p>
        </div>

        <Link
          className="staff-back-link"
          to="/admin/staff"
        >
          Manage Admins
        </Link>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <p
          className="staff-message staff-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}
      {notice && (
        <p
          className="staff-message staff-success"
          role="status"
        >
          {notice}
        </p>
      )}

      {/* =====================================
          CREATE NEW USER
      ===================================== */}

      <section className="staff-panel">
        <h2>
          <UserPlus size={19} />
          Add User Manually
        </h2>

        <p>
          Creates a regular USER account.
          Use Manage Admins for administrator access.
        </p>

        <form
          className="staff-form"
          onSubmit={create}
        >
          <label htmlFor="new-user-name">
            Full Name
          </label>

          <input
            id="new-user-name"
            type="text"
            minLength={2}
            maxLength={100}
            required
            value={form.full_name}
            onChange={(event) =>
              setForm({
                ...form,
                full_name: event.target.value,
              })
            }
          />

          <label htmlFor="new-user-email">
            Email Address
          </label>

          <input
            id="new-user-email"
            type="email"
            maxLength={254}
            required
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
          />

          <label htmlFor="new-user-password">
            Initial Password (12+ characters)
          </label>

          <input
            id="new-user-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value,
              })
            }
          />

          <button
            type="submit"
            disabled={busy}
          >
            {busy ? "Working..." : "Create User"}
          </button>
        </form>

        <p className="staff-hint">
          Share the initial password securely.
          Never post it publicly.
        </p>
      </section>

      {/* =====================================
          REGISTERED USER ACCOUNTS
      ===================================== */}

      <section className="staff-panel">

        <div className="staff-title-row">
          <h2>Registered Accounts</h2>

          <button
            className="staff-refresh"
            type="button"
            disabled={loading || busy}
            onClick={refresh}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* SEARCH */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "14px 0",
          }}
        >
          <Search size={17} />

          <input
            style={{
              flex: 1,
              minWidth: 0,
            }}
            type="search"
            value={filter}
            placeholder="Search users"
            aria-label="Filter registered users"
            onChange={(event) =>
              setFilter(event.target.value)
            }
          />
        </div>

        <p className="staff-hint">
          Showing {visible.length} of {users.length}
          {" "}recent accounts (up to 300).
        </p>

        {/* USER TABLE */}
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((user) => (
                  <tr key={user.user_id}>

                    {/* USER INFORMATION */}
                    <td>
                      <strong>
                        {user.full_name}
                      </strong>

                      <div
                        style={{
                          overflowWrap: "anywhere",
                        }}
                      >
                        {user.email}
                      </div>
                    </td>

                    {/* ROLE */}
                    <td>
                      <span className="staff-role">
                        {user.role}
                      </span>
                    </td>

                    {/* BAN STATUS */}
                    <td>
                      <strong>
                        {user.account_status}
                      </strong>

                      {user.account_status ===
                        "TEMPORARY" && (
                        <div>
                          Until {user.ban_until_utc}
                        </div>
                      )}

                      {user.account_status !==
                        "ACTIVE" &&
                        user.ban_reason && (
                          <div>
                            Reason: {user.ban_reason}
                          </div>
                        )}
                    </td>

                    {/* MANAGEMENT ACTIONS */}
                    <td>
                      {user.role === "SUPER_ADMIN" ? (
                        <span className="staff-protected">
                          Protected
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 7,
                            minWidth: 230,
                          }}
                        >

                          {/* UNBAN */}
                          {user.account_status !==
                            "ACTIVE" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                ban(user, "UNBAN")
                              }
                            >
                              Unban
                            </button>
                          )}

                          {/* 1 DAY */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              ban(
                                user,
                                "TEMPORARY",
                                24
                              )
                            }
                          >
                            Ban 1 Day
                          </button>

                          {/* 7 DAYS */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              ban(
                                user,
                                "TEMPORARY",
                                168
                              )
                            }
                          >
                            Ban 7 Days
                          </button>

                          {/* 30 DAYS */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              ban(
                                user,
                                "TEMPORARY",
                                720
                              )
                            }
                          >
                            Ban 30 Days
                          </button>

                          {/* PERMANENT BAN */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              ban(user, "PERMANENT")
                            }
                          >
                            Ban Permanently
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            className="staff-demote"
                            disabled={busy}
                            onClick={() =>
                              remove(user)
                            }
                          >
                            Delete Account
                          </button>

                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!visible.length && (
              <p>No matching accounts.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}