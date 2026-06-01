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
            <h2 style="color:#0b5fff;margin:0 0 16px">Xush kelibsiz, ${safeName}!</h2>
            <p>${APP_NAME} platformasiga ro'yxatdan o'tganingiz uchun rahmat.</p>
            <p>Quyida sizning kirish ma'lumotlaringiz:</p>
            <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Email</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeEmail}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Parol</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb"><code>${safePassword}</code></td></tr>
            </table>
            <p>Saytga kirish: <a href="${APP_URL}">${APP_URL}</a></p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">
                Xavfsizlik uchun parolingizni hech kim bilan baham ko'rmang. Agar bu ro'yxatdan o'tishni siz amalga oshirmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${from}>`,
        to: args.to,
        subject: `${APP_NAME} — ro'yxatdan o'tganingiz uchun rahmat`,
        text:
            `Xush kelibsiz, ${args.name}!\n\n` +
            `${APP_NAME} platformasiga ro'yxatdan o'tganingiz uchun rahmat.\n\n` +
            `Email: ${args.to}\nParol: ${args.password}\n\n` +
            `Saytga kirish: ${APP_URL}\n`,
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
            <h2 style="color:#0b5fff;margin:0 0 16px">Parolni tiklash — ${APP_NAME}</h2>
            <p>Assalomu alaykum, ${safeName}!</p>
            <p>Siz parolni tiklash so'rovini yubordingiz. Sizning hisobingiz uchun yangi vaqtinchalik parol yaratildi:</p>
            <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Email</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeEmail}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Yangi parol</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb"><code>${safePassword}</code></td></tr>
            </table>
            <p>Saytga kirish: <a href="${APP_URL}/auth/login">${APP_URL}/auth/login</a></p>
            <p style="color:#b45309;font-size:13px;margin-top:16px">
                ⚠️ Xavfsizlik uchun kirgandan keyin profilingizdan parolni o'zgartirishni tavsiya etamiz.
            </p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">
                Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring va biz bilan bog'laning — kimdir sizning emailingiz bilan tiklashga urinmoqda.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${from}>`,
        to: args.to,
        subject: `${APP_NAME} — parolni tiklash`,
        text:
            `Assalomu alaykum, ${args.name}!\n\n` +
            `Parolni tiklash so'rovingiz qabul qilindi. Yangi vaqtinchalik parolingiz:\n\n` +
            `Email: ${args.to}\nYangi parol: ${args.newPassword}\n\n` +
            `Saytga kirish: ${APP_URL}/auth/login\n\n` +
            `Xavfsizlik uchun kirgandan keyin parolingizni o'zgartiring.\n`,
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
            <h2 style="margin:0 0 16px">${APP_NAME} — yangi foydalanuvchi</h2>
            <table style="border-collapse:collapse;margin:8px 0">
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Ism</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeName}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Email</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${safeEmail}</td></tr>
                <tr><td style="padding:6px 12px;background:#f5f7fb;border:1px solid #e5e7eb"><b>Vaqt</b></td>
                    <td style="padding:6px 12px;border:1px solid #e5e7eb">${new Date().toISOString()}</td></tr>
            </table>
        </div>
    `;

    await transporter.sendMail({
        from: `"${APP_NAME}" <${from}>`,
        to: adminTo,
        subject: `${APP_NAME} — yangi foydalanuvchi: ${args.name}`,
        text: `Yangi foydalanuvchi ro'yxatdan o'tdi.\n\nIsm: ${args.name}\nEmail: ${args.email}\nVaqt: ${new Date().toISOString()}\n`,
        html,
    });
}
