
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  RefreshCw,
  UserPlus,
  Search,
} from "lucide-react";

import api from "../api/api";
import AccountActionModal from "../components/AccountActionModal";

const readError = (error) =>
  error.response?.data?.message ||
  "Request failed. Check your connection or Netlify logs.";

const initialForm = {
  full_name: "",
  email: "",
  password: "",
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState(null);

  // =====================================
  // LOAD USERS
  // =====================================

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get("/admin/manage-users");

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
  // CREATE NEW USER
  // =====================================

  const create = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data } = await api.post("/admin/manage-users", {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setForm(initialForm);
      await refresh();
      setNotice(data.message);
    } catch (err) {
      setError(readError(err));
    } finally {
      setBusy(false);
    }
  };

  // =====================================
  // OPEN ACTION POPUP
  // =====================================

  const openDialog = (user, action, hours = null) => {
    if (busy) return;

    setDialog({ user, action, hours });
    setError("");
    setNotice("");
  };

  // =====================================
  // CONFIRM ACTION + SEND EMAIL
  // =====================================

  const submitDialog = async ({ reason, confirmEmail }) => {
    if (!dialog || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const userId = dialog.user.user_id;
      let response;

      if (dialog.action === "DELETE") {
        response = await api.delete(
          `/admin/manage-users/${userId}`,
          {
            data: {
              confirm_email: confirmEmail,
              reason,
            },
          }
        );
      } else {
        response = await api.patch(
          `/admin/manage-users/${userId}/ban`,
          {
            action: dialog.action,
            hours: dialog.hours,
            reason,
          }
        );
      }

      setDialog(null);

      const emailMessage =
        response.data.email_sent === true
          ? "Email notification accepted by the provider."
          : "The action succeeded, but the email could not be sent. Check Netlify logs.";

      await refresh();

      setNotice(`${response.data.message} ${emailMessage}`);
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

      {/* ACTION CONFIRMATION POPUP */}
      {dialog && (
        <AccountActionModal
          key={`${dialog.user.user_id}-${dialog.action}-${dialog.hours || 0}`}
          dialog={dialog}
          busy={busy}
          error={error}
          onClose={() => {
            if (!busy) {
              setDialog(null);
              setError("");
            }
          }}
          onConfirm={submitDialog}
        />
      )}

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

      {/* ERROR */}
      {error && !dialog && (
        <p
          className="staff-message staff-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* SUCCESS */}
      {notice && (
        <p
          className="staff-message staff-success"
          role="status"
        >
          {notice}
        </p>
      )}

      {/* =====================================
          ADD USER MANUALLY
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

        <form className="staff-form" onSubmit={create}>
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

          <button type="submit" disabled={busy}>
            {busy ? "Working..." : "Create User"}
          </button>
        </form>

        <p className="staff-hint">
          Share the initial password securely.
          Never post it publicly.
        </p>
      </section>

      {/* =====================================
          REGISTERED ACCOUNTS
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
            type="search"
            value={filter}
            placeholder="Search users"
            aria-label="Filter registered users"
            onChange={(event) =>
              setFilter(event.target.value)
            }
            style={{
              flex: 1,
              minWidth: 0,
            }}
          />
        </div>

        <p className="staff-hint">
          Showing {visible.length} of {users.length}{" "}
          recent accounts (up to 300).
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
                    {/* USER */}
                    <td>
                      <strong>{user.full_name}</strong>

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

                    {/* ACCOUNT STATUS */}
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

                    {/* MANAGEMENT BUTTONS */}
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
                                openDialog(
                                  user,
                                  "UNBAN"
                                )
                              }
                            >
                              Unban
                            </button>
                          )}

                          {/* BAN 1 DAY */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              openDialog(
                                user,
                                "TEMPORARY",
                                24
                              )
                            }
                          >
                            Ban 1 Day
                          </button>

                          {/* BAN 7 DAYS */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              openDialog(
                                user,
                                "TEMPORARY",
                                168
                              )
                            }
                          >
                            Ban 7 Days
                          </button>

                          {/* BAN 30 DAYS */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              openDialog(
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
                              openDialog(
                                user,
                                "PERMANENT"
                              )
                            }
                          >
                            Ban Permanently
                          </button>

                          {/* DELETE ACCOUNT */}
                          <button
                            type="button"
                            className="staff-demote"
                            disabled={busy}
                            onClick={() =>
                              openDialog(
                                user,
                                "DELETE"
                              )
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
