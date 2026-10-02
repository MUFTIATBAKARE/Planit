import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { GuestGateProvider } from "@/components/guest/GuestGateProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";

const dashboardTitle = "Your task dashboard";
const dashboardDescription =
  "Your private, real-time Planit task list — capture tasks, complete them and keep everything in sync.";

export const metadata: Metadata = {
  /* Private screen: stays out of search results, but keeps share tags intact. */
  title: dashboardTitle,
  description: dashboardDescription,
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/dashboard" },
  openGraph: {
    type: "website",
    url: "/dashboard",
    siteName: "Planit",
    title: dashboardTitle,
    description: dashboardDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: dashboardTitle,
    description: dashboardDescription,
  },
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      {/* Hosts the Guest Mode paywall intercept for every gated V3 control. */}
      <GuestGateProvider>
        <DashboardShell>
          <DashboardView />
        </DashboardShell>
      </GuestGateProvider>
    </RequireAuth>
  );
}
