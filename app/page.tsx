import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-6xl space-y-10 rounded-[2rem] border border-border bg-card p-10 shadow-sm shadow-black/5">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.33em] text-accent-foreground">
              LIC Enterprise
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Internal staff portal for LIC enterprise operations.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              A secure, role-aware system for agents, officers, managers, branch teams, and regional administrators. Coming soon: policies, premiums, commissions, claims, leads and internal notifications.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                Sign in
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/60">
                Preview dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border bg-background p-6 shadow-sm shadow-black/5">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground shadow-lg shadow-primary/20">
              <p className="text-sm uppercase tracking-[0.25em] text-primary-foreground/80">Foundation build</p>
              <h2 className="mt-4 text-3xl font-semibold">PWA-ready shell</h2>
              <p className="mt-3 text-sm leading-7 text-primary-foreground/90">
                Built with Next.js App Router, Tailwind, shadcn components, TanStack Table, Recharts and MongoDB foundation wiring.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-card p-4 text-sm shadow-sm shadow-black/5">
                <p className="font-semibold">Role-aware navigation</p>
                <p className="mt-1 text-muted-foreground">Sidebar + mobile bottom nav swap correctly.</p>
              </div>
              <div className="rounded-[1.5rem] bg-card p-4 text-sm shadow-sm shadow-black/5">
                <p className="font-semibold">DB health check</p>
                <p className="mt-1 text-muted-foreground">MongoDB ping route at <code className="rounded bg-muted px-1 py-0.5">/api/health</code>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
