const { sendTransactionalEmail } = require("./transactionalEmail");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]
  );

module.exports = async function securityCodeEmail({
  to,
  name,
  code,
  purpose,
}) {
  const from =
    process.env.PASSWORD_EMAIL_FROM ||
    process.env.REPORT_EMAIL_FROM;

  const title =
    purpose === "RESET"
      ? "Reset your password"
      : "Confirm your password change";

  const text =
    `Hello ${name || "Gamer"},\n\n` +
    `Your GameBalance verification code is: ${code}\n\n` +
    "This code expires in 10 minutes.\n" +
    "Never share it with anyone.\n" +
    "If you did not request this, ignore the email.";

  const html = `
    <div style="
      font-family:Arial,sans-serif;
      max-width:480px;
      margin:auto;
      padding:28px;
      background:#111014;
      color:#fafafa
    ">
      <h1 style="color:#ff3355">GameBalance</h1>
      <h2>${title}</h2>
      <p>Hello ${escapeHtml(name || "Gamer")},</p>
      <p>Enter this verification code:</p>
      <p style="
        font-size:34px;
        letter-spacing:8px;
        font-weight:800;
        color:#ff5674
      ">${code}</p>
      <p>Expires in <strong>10 minutes</strong>.</p>
      <p>Never share this code.</p>
      <p style="color:#aaa">
        If you did not request this, ignore this email.
      </p>
    </div>
  `;

  await sendTransactionalEmail({
    from,
    to,
    subject: `GameBalance: ${title}`,
    html,
    text,
  });
};
