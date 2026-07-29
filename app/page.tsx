import Link from "next/link"
import {
  ShieldCheck,
  FileText,
  DollarSign,
  Sparkles,
  Users2,
  Bell,
  LineChart,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#041e42] via-[#0b2b5c] to-[#0f3d91] text-white overflow-hidden relative">
      {/* Decorative background glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />

      {/* Outer wrapper container */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col justify-between min-h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-12 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
              L
            </div>
            <div>
              <p className="font-bold text-lg tracking-tight">LIC Enterprise</p>
              <p className="text-xs text-white/60">Operations & Management Portal</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-white text-[#041e42] px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-black/10"
          >
            Sign In <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </header>

        {/* Hero Section */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center py-12 md:py-16">
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              <Sparkles className="size-3.5" /> Built for Scale & Trust
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-white leading-[1.1]">
              The Ultimate Portal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">LIC Operations</span>
            </h1>
            <p className="max-w-2xl text-base md:text-lg leading-relaxed text-white/80">
              Empowering the Life Insurance Corporation of India's internal staff, regional administrators, branch managers, development officers, and field agents. A unified console to monitor performance, settle commissions, and track the full policy lifecycle.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-amber-400 text-[#041e42] px-8 py-4 text-base font-bold transition-all hover:bg-amber-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/10"
              >
                Launch Admin Console
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 text-base font-semibold transition-all hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95"
              >
                Preview Dashboard
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-lg p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl" />
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">LIC Heritage</p>
              <h2 className="mt-2 text-2xl font-bold">Years of Protection</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Since 1956, the Life Insurance Corporation of India has been the cornerstone of trust, securing millions of lives. This digital workspace optimizes policy distribution, agent hierarchy routing, and premium calculations.
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/60">Active Policies</p>
                  <p className="text-xl font-bold mt-1">300M+</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/60">Agent Force</p>
                  <p className="text-xl font-bold mt-1">1.2M+</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="py-12 border-t border-white/10">
          <h3 className="text-center text-xs uppercase tracking-[0.25em] text-amber-400 font-bold mb-8">Integrated Platform Features</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all hover:scale-[1.02]">
              <div className="p-3 rounded-2xl bg-amber-400/10 text-amber-400 w-fit">
                <FileText className="size-6" />
              </div>
              <h4 className="font-bold text-lg mt-4">Policy Lifecycle</h4>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Seamless policy generation, automated maturity timeline calculations, status audits, and customer linkages.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all hover:scale-[1.02]">
              <div className="p-3 rounded-2xl bg-emerald-400/10 text-emerald-400 w-fit">
                <DollarSign className="size-6" />
              </div>
              <h4 className="font-bold text-lg mt-4">Premiums & Collections</h4>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Collection schedules, offline payment logging (CASH, UPI, UPI, ONLINE), automatic grace periods, and late fee tracking.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all hover:scale-[1.02]">
              <div className="p-3 rounded-2xl bg-indigo-400/10 text-indigo-400 w-fit">
                <Users2 className="size-6" />
              </div>
              <h4 className="font-bold text-lg mt-4">Hierarchy Tree</h4>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Visual organization mapping from Head Office down to Regional Zones, Branch Offices, DOs, and Field Agents.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all hover:scale-[1.02]">
              <div className="p-3 rounded-2xl bg-rose-400/10 text-rose-400 w-fit">
                <ShieldCheck className="size-6" />
              </div>
              <h4 className="font-bold text-lg mt-4">Claims processing</h4>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                File and track maturity, death, surrender, and rider claims, with full reviewer validation workflows.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-white/10 text-center text-xs text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Life Insurance Corporation of India. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Staff Login</Link>
            <a href="/api/health" className="hover:text-white transition-colors">API Diagnostics</a>
          </div>
        </footer>
        
      </div>
    </main>
  )
}
