/**
 * Transactional email transport for GameBalance.
 * Default: existing Resend setup. Switch with EMAIL_PROVIDER=brevo only
 * after verifying a Brevo sender and activating transactional email.
 * No API keys or personal information are stored in source code.
 */
const providerName = () =>
  String(process.env.EMAIL_PROVIDER || "resend").trim().toLowerCase();

const isEmailConfigured = (resendFrom) => {
  if (providerName() === "brevo") {
    return Boolean(
      process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL
    );
  }
  if (providerName() === "resend") {
    return Boolean(process.env.RESEND_API_KEY && resendFrom);
  }
  return false;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendTransactionalEmail = async ({ to, from, subject, html, text }) => {
  const provider = providerName();
  if (!isEmailConfigured(from)) {
    throw new Error("Email provider is not configured");
  }
  if (typeof to !== "string" || !emailPattern.test(to.trim())) {
    throw new Error("A valid recipient email is required");
  }

  let url, headers, body;
  if (provider === "brevo") {
    const senderEmail = process.env.BREVO_SENDER_EMAIL.trim();
    if (!emailPattern.test(senderEmail)) {
      throw new Error("Invalid Brevo sender address");
    }
    url = "https://api.brevo.com/v3/smtp/email";
    headers = {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    };
    body = {
      sender: {
        email: senderEmail,
        name: process.env.BREVO_SENDER_NAME || "GameBalance",
      },
      to: [{ email: to.trim() }],
      subject,
      htmlContent: html,
      textContent: text,
    };
  } else if (provider === "resend") {
    url = "https://api.resend.com/emails";
    headers = {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    body = { from, to: [to.trim()], subject, html, text };
  } else {
    throw new Error("Unknown email provider");
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Do not expose API keys, email addresses, OTPs or full provider payloads.
    console.error(`${provider} email API rejected request: HTTP ${response.status}`);
    const error = new Error("Email provider rejected the request");
    error.status = response.status;
    throw error;
  }
  return {
    id: result.messageId || result.id || null,
    provider,
  };
};

module.exports = { isEmailConfigured, sendTransactionalEmail };
