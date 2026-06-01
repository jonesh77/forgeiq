import nodemailer, { type Transporter } from "nodemailer";

const APP_NAME = "ForgeIQ";
const APP_URL = "https://forgeiq.dev";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
    if (cachedTransporter) return cachedTransporter;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
        console.warn("[email] SMTP_USER / SMTP_PASS not configured — emails will be skipped");
        return null;
    }

    cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: (process.env.SMTP_SECURE ?? "true") === "true",
        auth: { user, pass },
    });
    return cachedTransporter;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export async function sendWelcomeEmail(args: {
    to: string;
    name: string;
    password: string;
}): Promise<void> {
    const transporter = getTransporter();
    if (!transporter) return;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
    const safeName = escapeHtml(args.name);
    const safeEmail = escapeHtml(args.to);
    const safePassword = escapeHtml(args.password);

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
            <h2 style="color:#0b5fff;margin:0 0 16px">Welcome to ${APP_NAME}, ${safeName}!</h2>
            <p>Thank you for signing up for the ${APP_NAME} platform.</p>
            <p>Here are your login credentials:</p>
            <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Email</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeEmail}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Password</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb"><code>${safePassword}</code></td></tr>
            </table>
            <p>Sign in here: <a href="${APP_URL}">${APP_URL}</a></p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">
                For your security, do not share your password with anyone. If you did not create this account, please ignore this email.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${from}>`,
        to: args.to,
        subject: `${APP_NAME} — thank you for signing up`,
        text:
            `Welcome to ${APP_NAME}, ${args.name}!\n\n` +
            `Thank you for signing up.\n\n` +
            `Email: ${args.to}\nPassword: ${args.password}\n\n` +
            `Sign in: ${APP_URL}\n`,
        html,
    });
}

export async function sendPasswordResetEmail(args: {
    to: string;
    name: string;
    newPassword: string;
}): Promise<void> {
    const transporter = getTransporter();
    if (!transporter) return;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
    const safeName = escapeHtml(args.name);
    const safeEmail = escapeHtml(args.to);
    const safePassword = escapeHtml(args.newPassword);

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
            <h2 style="color:#0b5fff;margin:0 0 16px">Password reset — ${APP_NAME}</h2>
            <p>Hello, ${safeName}!</p>
            <p>You requested a password reset. A new temporary password has been generated for your account:</p>
            <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Email</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeEmail}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>New password</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb"><code>${safePassword}</code></td></tr>
            </table>
            <p>Sign in here: <a href="${APP_URL}/auth/login">${APP_URL}/auth/login</a></p>
            <p style="color:#b45309;font-size:13px;margin-top:16px">
                ⚠️ For security, please change your password from your profile after signing in.
            </p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">
                If you did not request this reset, please ignore this email and contact us — someone may be trying to access your account.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${from}>`,
        to: args.to,
        subject: `${APP_NAME} — password reset`,
        text:
            `Hello, ${args.name}!\n\n` +
            `Your password reset request was processed. Your new temporary password:\n\n` +
            `Email: ${args.to}\nNew password: ${args.newPassword}\n\n` +
            `Sign in: ${APP_URL}/auth/login\n\n` +
            `For security, please change your password after signing in.\n`,
        html,
    });
}

export async function sendAdminNewUserEmail(args: {
    name: string;
    email: string;
}): Promise<void> {
    const transporter = getTransporter();
    if (!transporter) return;

    const adminTo = process.env.ADMIN_EMAIL;
    if (!adminTo) {
        console.warn("[email] ADMIN_EMAIL not configured — admin notification skipped");
        return;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
    const safeName = escapeHtml(args.name);
    const safeEmail = escapeHtml(args.email);

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
            <h2 style="margin:0 0 16px">${APP_NAME} — new user</h2>
            <table style="border-collapse:collapse;margin:8px 0">
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Name</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeName}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Email</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeEmail}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Time</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${new Date().toISOString()}</td></tr>
            </table>
        </div>
    `;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${from}>`,
        to: adminTo,
        subject: `${APP_NAME} — new user: ${args.name}`,
        text: `A new user signed up.\n\nName: ${args.name}\nEmail: ${args.email}\nTime: ${new Date().toISOString()}\n`,
        html,
    });
}
