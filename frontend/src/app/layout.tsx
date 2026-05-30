import type { Metadata } from "next";
import { Public_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { headers } from "next/headers";
import { ProvideUser } from "@/lib/user";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";
import { NotificationProvider } from "@/components/our/notification-context";
import { AiAssistant } from "@/components/our/ai-assistant";
import { Analytics } from "@vercel/analytics/next";

const publicsans = Public_Sans({
  variable: "--font-publicsans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ForgeIQ · by NSMLab",
  description: "ForgeIQ — intelligence for forging design. Cogging optimization, processing maps, and 3D preform prediction in one workbench. Built by NSMLab, Sogang University.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();

  const dec = (v: string | null) => {
    if (!v) return "";
    try { return decodeURIComponent(v); } catch { return v; }
  };
  const user = {
    name: dec(h.get("name")),
    email: dec(h.get("email")),
    id: dec(h.get("userid")),
    isSignedIn: h.get("isSignedIn") === "true",
  };

  return (
    <html lang="en">
      <body
        className={`${publicsans.variable} ${montserrat.variable} antialiased`}
      >
        <Script
          id="mathjax"
          strategy="beforeInteractive"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        />
        <I18nProvider>
          <ProvideUser user={user}>
            <NotificationProvider>
              {children}
              {user.isSignedIn && <AiAssistant />}
            </NotificationProvider>
          </ProvideUser>
          <Toaster position="bottom-right" richColors />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
