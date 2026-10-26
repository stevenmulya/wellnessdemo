/**
 * TRANSACTIONAL EMAIL INTEGRATION TEMPLATE (RESEND / NODEMAILER / SENDGRID)
 * -------------------------------------------------------------------------
 * Central adapter for sending password reset links and cohort enrollment receipts.
 * Currently logs to server console in development.
 * To enable third-party email in production:
 * 1. Add RESEND_API_KEY or SMTP credentials in .env
 * 2. Uncomment the provider block below.
 */

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendTransactionalEmail(
  payload: SendEmailPayload
): Promise<{ delivered: boolean; provider: string }> {
  const provider = process.env.EMAIL_PROVIDER || "CONSOLE_DEV";

  if (provider === "RESEND" && process.env.RESEND_API_KEY) {
    // TODO [Third-Party Integration]:
    // await fetch("https://api.resend.com/emails", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     from: process.env.EMAIL_FROM || "Wellness Sanctuary <no-reply@wellness.id>",
    //     to: [payload.to],
    //     subject: payload.subject,
    //     html: payload.html,
    //   }),
    // });
    return { delivered: true, provider: "RESEND" };
  }

  console.log(`\n======================================================`);
  console.log(`[EMAIL ADAPTER - ${provider}]`);
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  if (payload.text) console.log(`Body: ${payload.text}`);
  console.log(`======================================================\n`);

  return { delivered: true, provider: "CONSOLE_DEV" };
}
