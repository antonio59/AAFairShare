import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Github, Globe, ArrowRight, Play } from "lucide-react";

const GITHUB_URL = "https://github.com/antonio59/AAFairShare";
const PORTFOLIO_URL = "https://antoniosmith.me";
const DEMO_MODE = import.meta.env.VITE_GUEST_MODE === "true";
const VIDEO_URL = "/aafairshare-walkthrough-v2.mp4";
const VIDEO_POSTER = "/screens/desktop/01-dashboard.png";

const moments = [
  {
    title: "Know who owes what",
    copy: "Monthly totals, fair share, and settlement — without opening a spreadsheet.",
    image: "/screens/desktop/01-dashboard.png",
    alt: "AAFairShare dashboard with shared expenses and settlement",
  },
  {
    title: "Keep the paper trail",
    copy: "Receipts, bills, and warranties live next to the expense, organised by address.",
    image: "/screens/desktop/05-documents.png",
    alt: "Document vault with receipts and bills",
  },
  {
    title: "See the pattern",
    copy: "Category and location trends, month-over-month spend, and document coverage.",
    image: "/screens/desktop/06-analytics.png",
    alt: "Analytics dashboard with spend trend and coverage",
  },
];

const Landing = () => {
  return (
    <div className="landing min-h-screen bg-[var(--landing-bg)] text-[var(--landing-fg)]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <span className="landing-display text-xl tracking-tight text-white sm:text-2xl">
            AAFairShare
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Portfolio</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero: one composition — brand, headline, line, CTAs, full-bleed product */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${VIDEO_POSTER})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(160deg,rgba(8,28,42,0.92)_0%,rgba(8,45,58,0.78)_45%,rgba(12,70,68,0.55)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <div className="max-w-2xl">
            <p className="landing-reveal landing-reveal-1 landing-display mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              AAFairShare
            </p>
            <h1 className="landing-reveal landing-reveal-2 mb-5 text-2xl font-medium leading-snug text-white/95 sm:text-3xl md:text-4xl">
              We retired the shared spreadsheet.
            </h1>
            <p className="landing-reveal landing-reveal-3 mb-8 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              A private two-person app for shared expenses, fair settlements, and the receipts that used to live in email.
            </p>
            <div className="landing-reveal landing-reveal-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              {DEMO_MODE ? (
                <Button
                  size="lg"
                  className="bg-[var(--landing-accent)] text-[var(--landing-accent-fg)] hover:bg-[var(--landing-accent-hover)]"
                  asChild
                >
                  <Link to="/dashboard">
                    <Play className="mr-2 h-4 w-4" />
                    Explore the demo
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-[var(--landing-accent)] text-[var(--landing-accent-fg)] hover:bg-[var(--landing-accent-hover)]"
                  asChild
                >
                  <a href="#tour">
                    See how it works
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Walkthrough */}
      <section id="tour" className="scroll-mt-8 bg-[var(--landing-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="landing-display text-3xl tracking-tight sm:text-4xl">
            Sixty seconds with the real UI
          </h2>
          <p className="mt-3 max-w-xl text-[var(--landing-muted)]">
            Captured from demo mode — dashboard through settlements, documents, and analytics.
          </p>
          <div className="landing-media mt-10 overflow-hidden rounded-sm border border-[var(--landing-border)] bg-[#0b1c24] shadow-[0_24px_80px_-32px_rgba(8,28,42,0.55)]">
            <video
              className="aspect-video w-full"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              poster={VIDEO_POSTER}
            >
              <source src={VIDEO_URL} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Product moments — screenshots, not icon cards */}
      <section className="border-t border-[var(--landing-border)] bg-[var(--landing-surface)] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="landing-display text-3xl tracking-tight sm:text-4xl">
            Built for two people who share everything
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--landing-muted)]">
            Expenses, recurring bills, bank linking, savings goals, and a document vault — one quiet place instead of three tabs and a Sheet.
          </p>

          <div className="mt-14 space-y-16 sm:space-y-24">
            {moments.map((moment, index) => (
              <article
                key={moment.title}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <h3 className="landing-display text-2xl tracking-tight sm:text-3xl">
                    {moment.title}
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-[var(--landing-muted)]">
                    {moment.copy}
                  </p>
                </div>
                <div className="landing-media overflow-hidden rounded-sm border border-[var(--landing-border)] bg-white shadow-[0_20px_60px_-28px_rgba(8,28,42,0.35)]">
                  <img
                    src={moment.image}
                    alt={moment.alt}
                    className="h-auto w-full"
                    loading="lazy"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering — one section */}
      <section className="border-t border-[var(--landing-border)] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="landing-display text-3xl tracking-tight sm:text-4xl">
            Engineered like production
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)]">
            React 19, TypeScript, Vite, and Convex for realtime data and auth. TrueLayer for bank linking, Resend for settlement emails, GitHub Actions for typecheck, lint, tests, and Netlify deploys. Scoped with short PRDs — still a private app for two.
          </p>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-[var(--landing-border)] bg-[var(--landing-ink)] py-20 text-[var(--landing-ink-fg)] sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="landing-display text-3xl tracking-tight sm:text-4xl">
            A real app, for real use
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--landing-ink-muted)]">
            Actively used for shared finances. The code is public if you want to look under the hood.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {DEMO_MODE && (
              <Button
                size="lg"
                className="bg-[var(--landing-accent)] text-[var(--landing-accent-fg)] hover:bg-[var(--landing-accent-hover)]"
                asChild
              >
                <Link to="/dashboard">
                  <Play className="mr-2 h-4 w-4" />
                  Explore the demo
                </Link>
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                antoniosmith.me
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[var(--landing-ink)] py-8 text-center text-sm text-[var(--landing-ink-muted)]">
        <p>AAFairShare · React · TypeScript · Convex</p>
        <p className="mt-2">© 2026</p>
      </footer>
    </div>
  );
};

export default Landing;
