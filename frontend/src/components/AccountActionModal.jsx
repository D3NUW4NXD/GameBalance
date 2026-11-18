
import { useState } from "react";

export default function AccountActionModal({
  dialog,
  busy,
  error,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const { user, action, hours } = dialog;

  const title =
    action === "DELETE"
      ? "Permanently delete account"
      : action === "UNBAN"
        ? "Remove account suspension"
        : action === "PERMANENT"
          ? "Permanent account suspension"
          : `Suspend account for ${hours / 24} day${hours === 24 ? "" : "s"}`;

  const emailMatches =
    confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  const needsReason = action !== "UNBAN";

  const validReason =
    reason.trim().length <= 255 &&
    (!needsReason || reason.trim().length >= 3);

  const submit = (event) => {
    event.preventDefault();

    if (
      !busy &&
      validReason &&
      (action !== "DELETE" || emailMatches)
    ) {
      onConfirm({
        reason: reason.trim(),
        confirmEmail: confirmEmail.trim(),
      });
    }
  };

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 9,
    border: "1px solid #626a7a",
    background: "#10131b",
    color: "white",
    padding: 12,
    font: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        padding: 16,
        background: "rgba(0,0,0,.78)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-title"
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: 24,
          borderRadius: 16,
          background: "#191b24",
          border: "1px solid #414657",
          color: "white",
          boxShadow: "0 28px 90px rgba(0,0,0,.55)",
        }}
      >
        <h2 id="action-title" style={{ marginTop: 0 }}>
          {title}
        </h2>

        <p style={{ color: "#cdd1da", overflowWrap: "anywhere" }}>
          <strong>{user.full_name}</strong> — {user.email}
        </p>

        {action === "TEMPORARY" && (
          <p>
            Ban duration: <strong>{hours / 24} day(s)</strong>
          </p>
        )}

        <p style={{ color: "#f7b7c3" }}>
          {action === "DELETE"
            ? "This permanently removes the account and its records. It cannot be undone."
            : "GameBalance will attempt to email the user about this action."}
        </p>

        {error && (
          <p role="alert" style={{ color: "#ff879b" }}>
            {error}
          </p>
        )}

        <form onSubmit={submit}>
          <label
            htmlFor="action-reason"
            style={{ display: "block", marginBottom: 8 }}
          >
            {action === "UNBAN"
              ? "Optional message"
              : "Reason / message to email the user"}
          </label>

          <textarea
            id="action-reason"
            autoFocus
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required={needsReason}
            minLength={needsReason ? 3 : 0}
            maxLength={255}
            disabled={busy}
            placeholder="Explain why this action is being taken..."
            style={{
              ...fieldStyle,
              resize: "vertical",
            }}
          />

          <p style={{ fontSize: 12, color: "#aeb7c7" }}>
            {reason.length}/255 characters
          </p>

          {action === "DELETE" && (
            <>
              <label
                htmlFor="action-email"
                style={{ display: "block", marginBottom: 8 }}
              >
                Type the full email address to confirm deletion
              </label>

              <input
                id="action-email"
                type="text"
                autoComplete="off"
                required
                value={confirmEmail}
                onChange={(event) =>
                  setConfirmEmail(event.target.value)
                }
                disabled={busy}
                placeholder={user.email}
                style={fieldStyle}
              />
            </>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                busy ||
                !validReason ||
                (action === "DELETE" && !emailMatches)
              }
              style={{
                background:
                  action === "DELETE" ? "#bd2944" : "#3755be",
                color: "white",
              }}
            >
              {busy ? "Processing..." : "OK — Confirm & notify"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
