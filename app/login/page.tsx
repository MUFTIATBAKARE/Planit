import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

const authTitle = "Sign in or create your Planit account";
const authDescription =
  "Access your real-time task dashboard. Sign in with your email and password, or create a free Planit account in seconds.";

export const metadata: Metadata = {
  title: "Sign in",
  description: authDescription,
  /* Private session portal — keep it out of search results entirely. */
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/login" },
  openGraph: {
    type: "website",
    url: "/login",
    siteName: "Planit",
    title: authTitle,
    description: authDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: authTitle,
    description: authDescription,
  },
};

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <Logo />
        <ThemeToggle />
      </div>

      <AuthScreen />

      <Link
        href="/"
        className="rounded-lg text-sm text-text-muted-light transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:text-text-muted-dark dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
      >
        ← Back to home
      </Link>
    </main>
  );
}
