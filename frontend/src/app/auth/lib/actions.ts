"use server";

import { getCollection } from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { sendAdminNewUserEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateTempPassword(length = 10): string {
    // url-safe alphanumeric (no confusing 0/O, 1/l/I)
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.randomBytes(length);
    let out = "";
    for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}

const BCRYPT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 6;

export async function logout() {
    try {
        const session = await getSession();
        session.destroy();
    } catch (e) {
        console.error("logout failed:", e);
    }
    redirect("/auth/login");
}

export async function register(_message_obj: { message?: string }, formData: FormData) {
    try {
        const email = String(formData.get("email") || "").trim().toLowerCase();
        const password = String(formData.get("password") || "");
        const name = String(formData.get("name") || "").trim();

        if (!email || !password || !name) {
            return { message: "All fields are required" };
        }
        if (!EMAIL_RE.test(email)) {
            return { message: "Invalid email format" };
        }
        if (password.length < MIN_PASSWORD_LEN) {
            return { message: `Password must be at least ${MIN_PASSWORD_LEN} characters` };
        }

        const users = await getCollection("users");
        const existing = await users.findOne({ email });
        if (existing) {
            return { message: "An account with this email already exists" };
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const inserted = await users.insertOne({
            email,
            password: passwordHash,
            name,
            createdAt: new Date(),
        });

        if (!inserted.insertedId) {
            return { message: "Unable to create account, please try again" };
        }

        // Fire-and-forget notifications — email failure must not block sign-up
        Promise.allSettled([
            sendWelcomeEmail({ to: email, name, password }),
            sendAdminNewUserEmail({ name, email }),
        ]).then((results) => {
            for (const r of results) {
                if (r.status === "rejected") console.error("[register email]", r.reason);
            }
        });

        const session = await getSession();
        session.email = email;
        session.isSignedIn = true;
        session.name = name;
        session.userid = inserted.insertedId.toString();
        session.super = false;
        await session.save();
    } catch (e) {
        console.error("register failed:", e);
        return { message: "Server error: " + (e as any)?.message };
    }
    redirect("/");
}

export async function changePassword(
    _state: { message?: string; success?: boolean },
    formData: FormData,
): Promise<{ message: string; success: boolean }> {
    try {
        const session = await getSession();
        if (!session.isSignedIn || !session.userid) {
            return { message: "Avval tizimga kirishingiz kerak", success: false };
        }

        const currentPassword = String(formData.get("currentPassword") || "");
        const newPassword = String(formData.get("newPassword") || "");
        const confirmPassword = String(formData.get("confirmPassword") || "");

        if (!currentPassword || !newPassword || !confirmPassword) {
            return { message: "Hamma maydon to'ldirilishi shart", success: false };
        }
        if (newPassword.length < MIN_PASSWORD_LEN) {
            return { message: `Yangi parol kamida ${MIN_PASSWORD_LEN} ta belgi bo'lishi kerak`, success: false };
        }
        if (newPassword !== confirmPassword) {
            return { message: "Yangi parol va tasdiq bir xil emas", success: false };
        }
        if (newPassword === currentPassword) {
            return { message: "Yangi parol eski paroldan farq qilishi kerak", success: false };
        }

        const users = await getCollection("users");
        const user = await users.findOne({ _id: new ObjectId(session.userid) });
        if (!user) {
            return { message: "Foydalanuvchi topilmadi", success: false };
        }

        const storedPassword: string = user.password || "";
        let valid = false;
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            valid = await bcrypt.compare(currentPassword, storedPassword);
        } else {
            valid = storedPassword === currentPassword;
        }
        if (!valid) {
            return { message: "Joriy parol noto'g'ri", success: false };
        }

        const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await users.updateOne(
            { _id: user._id },
            { $set: { password: newHash, passwordChangedAt: new Date() } },
        );

        return { message: "Parol muvaffaqiyatli o'zgartirildi", success: true };
    } catch (e) {
        console.error("changePassword failed:", e);
        return { message: "Server xatosi, qaytadan urinib ko'ring", success: false };
    }
}

export async function requestPasswordReset(
    _state: { message?: string; success?: boolean },
    formData: FormData,
): Promise<{ message: string; success: boolean }> {
    try {
        const email = String(formData.get("email") || "").trim().toLowerCase();
        if (!email || !EMAIL_RE.test(email)) {
            return { message: "Iltimos to'g'ri email kiriting", success: false };
        }

        const users = await getCollection("users");
        const user = await users.findOne({ email });

        // Generic response — don't leak whether email exists
        const genericOk = {
            message: "Agar shu email ro'yxatda bo'lsa, yangi parol jo'natildi. Pochtangizni tekshiring.",
            success: true,
        };

        if (!user) return genericOk;

        const newPassword = generateTempPassword(10);
        const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await users.updateOne(
            { _id: user._id },
            { $set: { password: newHash, passwordResetAt: new Date() } },
        );

        try {
            await sendPasswordResetEmail({
                to: email,
                name: user.name || "foydalanuvchi",
                newPassword,
            });
        } catch (e) {
            console.error("[requestPasswordReset] email failed:", e);
            return {
                message: "Parol tiklandi, lekin email yuborib bo'lmadi. Admin bilan bog'laning.",
                success: false,
            };
        }

        return genericOk;
    } catch (e) {
        console.error("requestPasswordReset failed:", e);
        return { message: "Server xatosi, qaytadan urinib ko'ring", success: false };
    }
}

export async function login(_message_obj: { message?: string }, formData: FormData) {
    let shouldRedirect = false;
    try {
        const email = String(formData.get("email") || "").trim().toLowerCase();
        const password = String(formData.get("password") || "");

        if (!email || !password) {
            return { message: "Email and password are required" };
        }

        const users = await getCollection("users");
        const user = await users.findOne({ email });
        if (!user) {
            return { message: "Incorrect email or password" };
        }

        const storedPassword: string = user.password || "";
        let isValid = false;

        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            isValid = await bcrypt.compare(password, storedPassword);
        } else {
            // Legacy plaintext user — verify then upgrade to bcrypt
            if (storedPassword === password) {
                const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
                await users.updateOne({ _id: user._id }, { $set: { password: newHash } });
                isValid = true;
            }
        }

        if (!isValid) {
            return { message: "Incorrect email or password" };
        }

        const session = await getSession();
        session.email = user.email;
        session.isSignedIn = true;
        session.name = user.name;
        session.userid = user._id.toString();
        session.super = user.super ? true : false;
        await session.save();
        shouldRedirect = true;
    } catch (e) {
        console.error("login failed:", e);
        return { message: "Server error: " + (e as any)?.message };
    }
    if (shouldRedirect) redirect("/");
}

export async function sendMessage(_obj: { success?: boolean }, formData: FormData) {
    try {
        const session = await getSession();
        if (!session.isSignedIn) {
            return { success: false, error: "You must be signed in" };
        }

        const email = String(formData.get("email") || "").trim();
        const message = String(formData.get("message") || "").trim();

        if (!email || !EMAIL_RE.test(email)) {
            return { success: false, error: "Invalid email" };
        }
        if (!message) {
            return { success: false, error: "Message cannot be empty" };
        }

        const messages = await getCollection("messages");
        const added = await messages.insertOne({
            userid: new ObjectId(session.userid),
            email,
            message,
            status: "pending",
            sentAt: new Date(),
        });

        return { success: true, message_id: added.insertedId.toString() };
    } catch (e) {
        console.error("sendMessage failed:", e);
        return { success: false, error: "Server error" };
    }
}

export async function postReply(message_id: string, _: { success?: number }, formData: FormData) {
    try {
        const session = await getSession();
        if (!session.isSignedIn || !session.super) {
            return { success: 0, error: "Unauthorized" };
        }

        const reply = String(formData.get("reply") || "").trim();
        if (!reply) {
            return { success: 0, error: "Reply cannot be empty" };
        }

        const messages = await getCollection("messages");
        await messages.updateOne(
            { _id: new ObjectId(message_id) },
            { $set: { status: "responded", response: reply, respondedAt: new Date() } },
        );

        revalidatePath("/super/message");
        return { success: 1 };
    } catch (e) {
        console.error("postReply failed:", e);
        return { success: 0, error: "Server error" };
    }
}
