import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

/**
 * Poppins is the closest Google font to the type in the reference artwork
 * (geometric, rounded, wide) — self-hosted by next/font, so there is no runtime
 * request to a third party.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "Planit";
const siteTitle = "Planit | Pro-Level Task Management";
const siteDescription =
  "Planit is a real-time task manager for focused teams and individuals. Capture tasks instantly, complete them with one tap, and sync every change across devices with Firebase.";

/**
 * Master metadata. `metadataBase` is required so relative Open Graph,
 * Twitter and canonical URLs resolve to absolute ones at build time.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Planit",
  },
  description: siteDescription,
  keywords: [
    "task management",
    "to-do app",
    "productivity app",
    "real-time task manager",
    "team task tracker",
    "planit",
  ],
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    site: "@planit",
    creator: "@planit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/**
 * `themeColor` / `colorScheme` live in the `viewport` export — never inside
 * `metadata` — per the App Router API.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFEFEF" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

/**
 * Applies the stored (or system) theme before first paint so the dark/light
 * tokens never flash. It reads the same `planit-theme` key that
 * `ThemeProvider`/`ThemeToggle` write to, so the manual switch and this
 * pre-hydration paint can never disagree.
 */
const themeScript = `(function(){try{var stored=window.localStorage.getItem("planit-theme");var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var useDark=stored?stored==="dark":prefersDark;document.documentElement.classList.toggle("dark",useDark);}catch(error){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-app-bg-light text-text-body-light antialiased dark:bg-app-bg-dark dark:text-text-body-dark">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* First tab stop for keyboard users. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent-strong focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg focus:outline-none focus:ring-2 focus:ring-accent-strong focus:ring-offset-2"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

