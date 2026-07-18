import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PiggyBank,
  TrendingUp,
  BarChart3,
  Calendar,
  Target,
  Heart,
  Lock,
  Users,
  Receipt,
  FileText,
  Server,
  GitBranch,
  Layers,
  ChevronLeft,
  ChevronRight,
  Github,
  Globe,
  ArrowDown,
  Play,
  Landmark,
  FolderLock,
  Plane,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const GITHUB_URL = "https://github.com/antonio59/AAFairShare";
const PORTFOLIO_URL = "https://antoniosmith.xyz";
const DEMO_MODE = import.meta.env.VITE_GUEST_MODE === "true";

const Landing = () => {

  const isMobile = useIsMobile();

  const mobileSlides = [
    { src: "/screens/mobile/01-dashboard.png", title: "Dashboard", caption: "Monthly summary, totals, and expenses table" },
    { src: "/screens/mobile/02-add-expense.png", title: "Add expense", caption: "Receipts optional, categories/locations prefilled" },
    { src: "/screens/mobile/03-recurring.png", title: "Recurring", caption: "Bills and subscriptions with next due dates" },
    { src: "/screens/mobile/04-savings.png", title: "Savings goals", caption: "Progress, milestones, and contribution history" },
    { src: "/screens/mobile/05-receipts.png", title: "Receipts", caption: "Receipt vault with filters and previews" },
    { src: "/screens/mobile/06-analytics.png", title: "Analytics", caption: "Trends, category breakdowns, monthly view" },
    { src: "/screens/mobile/07-settings.png", title: "Settings", caption: "Profile, theme, and about/version" },
  ];

  const desktopSlides = [
    { src: "/screens/desktop/01-dashboard.png", title: "Dashboard", caption: "Desktop view with monthly summary" },
    { src: "/screens/desktop/02-add-expense.png", title: "Add expense", caption: "Desktop form with receipt state" },
    { src: "/screens/desktop/03-recurring.png", title: "Recurring", caption: "Bills table with next due" },
    { src: "/screens/desktop/04-savings.png", title: "Savings goals", caption: "Progress, milestones, and history" },
    { src: "/screens/desktop/05-receipts.png", title: "Receipts", caption: "Receipt vault with filters" },
    { src: "/screens/desktop/06-analytics.png", title: "Analytics", caption: "Category/location breakdowns" },
    { src: "/screens/desktop/07-settings.png", title: "Settings", caption: "Profile, theme, and about/version" },
  ];

  const slides = isMobile ? mobileSlides : desktopSlides;

  const [current, setCurrent] = useState(0);
  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)),
    [slides.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)),
    [slides.length],
  );

  // Keyboard navigation (←/→) for the product tour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev();
      else next();
    }
    touchStartX.current = null;
  };

  const featureHighlights = [
    {
      icon: <PiggyBank className="h-6 w-6" />,
      title: "Shared expense tracking",
      description: "50/50 by default with custom splits for edge cases."
    },
    {
      icon: <Landmark className="h-6 w-6" />,
      title: "Open banking sync",
      description: "TrueLayer integration with OAuth, token refresh, and auto-categorised transactions."
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      title: "Receipt vault",
      description: "Upload, store, and view receipts alongside each expense."
    },
    {
      icon: <FolderLock className="h-6 w-6" />,
      title: "Document vault",
      description: "Bills, warranties, and insurance with expiry tracking, organised by address."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Recurring bills",
      description: "Set it once for rent, utilities, and subscriptions — auto-generated monthly."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Settlement engine",
      description: "Instantly shows who owes what, with email confirmation."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Savings goals",
      description: "Progress bars, auto-contributions, and expense linking for big milestones."
    },
    {
      icon: <Plane className="h-6 w-6" />,
      title: "Holiday tracking",
      description: "Separate trip spending from the joint account with per-holiday totals."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics",
      description: "Spending trends, category breakdowns, year-end summaries, and PDF export."
    }
  ];

  const processNotes = [
    {
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      title: "PRD-driven",
      description: "Feature work starts with a short PRD and acceptance criteria."
    },
    {
      icon: <GitBranch className="h-5 w-5 text-blue-600" />,
      title: "Quality gates",
      description: "Every PR runs CI: typecheck, lint, build, and automated tests."
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      title: "No more spreadsheets",
      description: "Built to replace my clunky Excel settlement sheet for two people."
    }
  ];

  const techStack = [
    {
      icon: <Layers className="h-6 w-6 text-blue-600" />,
      title: "Frontend",
      description: "React 19, TypeScript, Vite, Tailwind (shadcn UI), Radix primitives."
    },
    {
      icon: <Server className="h-6 w-6 text-blue-600" />,
      title: "Backend & data",
      description: "Convex for data + auth, file storage for documents, Resend for email, TrueLayer for banking."
    },
    {
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      title: "Delivery",
      description: "pnpm + GitHub Actions CI (typecheck, lint, build, tests), Netlify hosting, PWA assets & offline-ready."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-background dark:to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              AAFairShare
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex items-center gap-1">
              <Users className="h-3 w-3" />
              2 Users
            </Badge>
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private App
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Portfolio</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4" variant="outline">
            <Heart className="h-3 w-3 mr-1 text-red-500" />
            Built for Couples
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Split Expenses,
            <br />
            Build Dreams Together
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The simplest way for couples to track shared expenses, settle up fairly, and save for life's biggest moments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            {DEMO_MODE ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  <Play className="h-4 w-4 mr-2" />
                  Explore the live demo
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href="#tour">
                  <ArrowDown className="h-4 w-4 mr-2" />
                  See the app
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center gap-3">
            <Badge variant="secondary" className="text-base px-6 py-2">
              <Lock className="h-4 w-4 mr-2" />
              Private app for 2 people — portfolio showcase
            </Badge>
            <p className="text-sm text-muted-foreground max-w-xl">
              Built to retire our shared Google Sheet and automate settlements without spreadsheets.
            </p>
          </div>
        </div>
      </div>

      {/* What & Why */}
      <div id="tour" className="bg-muted py-14 scroll-mt-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Product tour</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">See the app</h2>
            <p className="text-muted-foreground">Captured from demo mode for portfolio review — swipe or use arrow keys.</p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div
              className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-card shadow"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {slides.map((slide) => (
                  <div key={slide.src} className="min-w-full flex items-center justify-center bg-muted p-6">
                    <div className={`w-full ${isMobile ? "max-w-sm" : "max-w-4xl"} shadow-lg rounded-xl overflow-hidden bg-white dark:bg-card border border-border mx-auto`}>
                      <img
                        src={slide.src}
                        alt={`${slide.title} — ${slide.caption}`}
                        loading="lazy"
                        className={isMobile ? "w-full h-full object-contain bg-white dark:bg-card aspect-[10/21]" : "w-full h-full object-contain bg-white dark:bg-card max-h-[720px]"}
                      />
                    <div className="p-4 border-t">
                      <p className="text-sm font-semibold">{slide.title}</p>
                      <p className="text-xs text-muted-foreground">{slide.caption}</p>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-card shadow hover:bg-muted border"
              onClick={prev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-card shadow hover:bg-muted border"
              onClick={next}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  className={`h-2.5 w-2.5 rounded-full ${idx === current ? "bg-blue-600" : "bg-border"}`}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === current}
                  onClick={() => setCurrent(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What is AAFairShare?</h2>
            <p className="text-foreground text-lg mb-4">
              AAFairShare is a private, two-person finance app I built to replace a messy Excel sheet. It handles daily expenses, recurring bills, bank syncing, settlements, savings goals, and a full document vault so every purchase is documented.
            </p>
            <p className="text-foreground text-lg">
              The goal: zero spreadsheet wrangling, instant “who owes what,” and a clean audit trail when tax season or disputes appear.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-3">Why I built it</h3>
            <Card className="border-blue-100">
              <CardContent className="p-6 space-y-3 text-foreground">
                <p>• We were reconciling manually in Excel every month; it was brittle and slow.</p>
                <p>• Needed receipts attached to expenses instead of scattered inboxes.</p>
                <p>• Wanted automated settlements and email confirmations without adding more SaaS.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div id="features" className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Feature highlights</h2>
            <p className="text-muted-foreground text-lg">Built for two people, but engineered like a production app.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Process & recent work */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Process & PRD</h2>
            <p className="text-foreground mb-4">
              Each feature is scoped with a short PRD (kept private), acceptance criteria, and a post-release checklist. Recent work shipped:
            </p>
            <ul className="space-y-3 text-foreground">
              <li>• Open banking sync (TrueLayer) with auto-categorisation.</li>
              <li>• CI quality gates — typecheck, lint, build, and tests on every PR.</li>
              <li>• Document vault for bills, warranties, and insurance with expiry tracking.</li>
            </ul>
          </div>
          <div className="space-y-4">
            {processNotes.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5 flex gap-3 items-start">
                  <div className="mt-1">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Recent updates */}
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Recent updates</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-foreground">
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs uppercase text-blue-600 font-semibold">Banking</div>
                  <div className="font-semibold">Open banking sync</div>
                  <p className="text-muted-foreground">TrueLayer integration imports joint-account transactions and auto-categorises them.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs uppercase text-blue-600 font-semibold">Reliability</div>
                  <div className="font-semibold">CI quality gates</div>
                  <p className="text-muted-foreground">GitHub Actions enforces typecheck, lint, build, and bun tests on every pull request.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs uppercase text-blue-600 font-semibold">Savings</div>
                  <div className="font-semibold">Smarter goals</div>
                  <p className="text-muted-foreground">Auto-contributions via cron, plus linking real expenses directly to savings goals.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tech stack</h2>
            <p className="text-muted-foreground text-lg">Modern, fast, and secure—built to stay maintainable.</p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {techStack.map((item, i) => (
              <Card key={i} className="h-full">
                <CardContent className="p-6 space-y-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-teal-600 border-0">
          <CardContent className="p-12 text-center text-white">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Portfolio Project
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A real app, built for real use
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              AAFairShare is a private application actively used by a couple to manage their shared finances.
              The code is public — take a look under the hood, or see what else I've built.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10" asChild>
                <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  More from me
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2">AAFairShare</h3>
          <p className="text-muted-foreground mb-4">Built with ❤️ for couples who share everything</p>
          <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground mb-4">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <span>•</span>
            <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <Globe className="h-4 w-4" /> antoniosmith.xyz
            </a>
          </div>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Convex</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
          <p className="text-muted-foreground text-xs mt-4">
            © 2026 AAFairShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
