import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-light bg-surface-card-light dark:border-border-dark dark:bg-surface-card-dark">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-text-muted-light dark:text-text-muted-dark">
            Real-time task management powered by Firebase Authentication and
            Firestore — every change lands everywhere, instantly.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <a
                href="#features"
                className="rounded-lg text-text-body-light transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:text-text-body-dark dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                className="rounded-lg text-text-body-light transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg-light dark:text-text-body-dark dark:hover:text-accent-primary dark:focus-visible:ring-accent-primary dark:focus-visible:ring-offset-app-bg-dark"
              >
                How it works
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-border-light dark:border-border-dark">
        <p className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-text-muted-light sm:px-6 lg:px-8 lg:text-center dark:text-text-muted-dark">
          © {new Date().getFullYear()} Planit.
        </p>
      </div>
    </footer>
  );
}
