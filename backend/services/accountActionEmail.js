
const { sendTransactionalEmail } = require("./transactionalEmail");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]
  );

const durationLabel = (hours) =>
  hours % 24 === 0
    ? `${hours / 24} day${hours / 24 === 1 ? "" : "s"}`
    : `${hours} hour${hours === 1 ? "" : "s"}`;

module.exports = async function accountActionEmail({
  to,
  name,
  action,
  reason,
  hours,
  untilUtc,
}) {
  const subject = {
    TEMPORARY: "GameBalance: Temporary account suspension",
    PERMANENT: "GameBalance: Account suspended permanently",
    UNBAN: "GameBalance: Account access restored",
    DELETE: "GameBalance: Account deletion notice",
  }[action];

  if (!subject) throw new Error("Unknown account action");

  const description = {
    TEMPORARY: "Your GameBalance account has been temporarily suspended.",
    PERMANENT: "Your GameBalance account has been permanently suspended.",
    UNBAN: "Your GameBalance account suspension has been removed.",
    DELETE: "Your GameBalance account has been permanently deleted.",
  }[action];

  const actionTimeUtc =
    new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const details = [`Action time: ${actionTimeUtc}`];

  if (action === "TEMPORARY") {
    details.push(`Duration: ${durationLabel(hours)}`);
    details.push(`Suspension ends: ${untilUtc}`);
  } else if (action === "PERMANENT") {
    details.push("Duration: Permanent (no scheduled end date)");
  }

  if (reason) {
    details.push(`Administrator's message: ${reason}`);
  }

  const greeting = `Hello ${name || "Gamer"},`;
  const footer =
    "If you believe this was a mistake, please contact GameBalance support.";

  const text = [
    greeting,
    "",
    description,
    "",
    ...details,
    "",
    footer,
  ].join("\n");

  const htmlDetails = details
    .map(
      (line) =>
        `<p style="margin:8px 0;overflow-wrap:anywhere">${escapeHtml(line)}</p>`
    )
    .join("");

  const html = `
    <div style="
      font-family:Arial,sans-serif;
      max-width:520px;
      margin:auto;
      padding:30px;
      background:#15161d;
      color:#f5f5f5
    ">
      <h1 style="color:#fb5473">GameBalance</h1>
      <h2>${escapeHtml(subject.replace("GameBalance: ", ""))}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(description)}</p>

      <div style="
        background:#222530;
        border-radius:10px;
        padding:15px 20px;
        margin:22px 0
      ">
        ${htmlDetails}
      </div>

      <p style="color:#c0c4cf">
        ${escapeHtml(footer)}
      </p>
    </div>
  `;

  await sendTransactionalEmail({
    to,
    from:
      process.env.PASSWORD_EMAIL_FROM ||
      process.env.REPORT_EMAIL_FROM,
    subject,
    text,
    html,
  });
};
