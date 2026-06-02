import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/getSession";

export interface SessionData {
    userid: string;
    email: string;
    name: string;
    isSignedIn: boolean;
    super: boolean;
}

// Routes that require a signed-in user. Everything else is publicly accessible
// (demo mode): landing, /cogging, /processing_map, /3d_preform, /workflow,
// /compare, /auth/*. Signed-in users get the same routes plus the personal
// cabinet (history, messages, settings).
const AUTH_REQUIRED_PREFIXES = ["/history", "/message", "/settings", "/super"];

function requiresAuth(path: string): boolean {
    return AUTH_REQUIRED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

// HTTP headers only accept ByteString (chars 0-255). Names like "알리벡" or
// "Алибек" must be percent-encoded before being placed in a header, then
// decoded on the read side (layout.tsx -> getUserServer / ProvideUser).
function safeHeader(v: string): string {
    return encodeURIComponent(v || "");
}

function attachSessionHeaders(headers: Headers, session: SessionData): Headers {
    const out = new Headers(headers);
    out.set("userid", safeHeader(session.userid));
    out.set("email", safeHeader(session.email));
    out.set("name", safeHeader(session.name));
    out.set("isSignedIn", session.isSignedIn ? "true" : "false");
    out.set("super", session.super ? "true" : "false");
    return out;
}

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const goingToAuth = path.startsWith("/auth");
    const goingToSuper = path.startsWith("/super");

    let session: SessionData;
    try {
        const s = await getSession();
        session = {
            userid: s.userid || "",
            email: s.email || "",
            name: s.name || "",
            isSignedIn: !!s.isSignedIn,
            super: !!s.super,
        };
    } catch (e) {
        console.error("[middleware] Session error:", e);
        // On session read failure, treat as anonymous and let public routes through.
        // Only block protected pages so we don't leak personal data.
        if (goingToAuth || !requiresAuth(path)) return NextResponse.next();
        return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
    }

    const { isSignedIn, super: isSuper } = session;

    if (goingToAuth) {
        if (isSignedIn) return NextResponse.redirect(new URL("/", req.nextUrl));
        return NextResponse.next();
    }

    if (requiresAuth(path) && !isSignedIn) {
        const loginUrl = new URL("/auth/login", req.nextUrl);
        loginUrl.searchParams.set("next", path);
        return NextResponse.redirect(loginUrl);
    }

    if (goingToSuper && !isSuper) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    const modifiedHeaders = attachSessionHeaders(req.headers, session);
    modifiedHeaders.set("current-url", safeHeader(req.nextUrl.href));
    return NextResponse.next({ request: { headers: modifiedHeaders } });
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
