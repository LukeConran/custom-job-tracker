import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-line/80 bg-ink-soft/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brass">
            Field notes
          </p>
          <h1 className="font-serif text-2xl tracking-tight text-paper group-hover:text-brass">
            Application Scout
          </h1>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-paper-dim hover:bg-panel hover:text-paper"
          >
            Next to apply
          </Link>
          <Link
            href="/applications"
            className="rounded-full px-3 py-1.5 text-paper-dim hover:bg-panel hover:text-paper"
          >
            Applications
          </Link>
        </nav>
      </div>
    </header>
  );
}
