import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const Landing = () => {

  const slides = [
    { src: "/screens/01-dashboard.png", title: "Dashboard", caption: "Monthly summary, totals, and expenses table" },
    { src: "/screens/02-add-expense.png", title: "Add expense", caption: "Receipts optional, categories/locations prefilled" },
    { src: "/screens/03-recurring.png", title: "Recurring", caption: "Bills and subscriptions with next due dates" },
    { src: "/screens/04-savings.png", title: "Savings goals", caption: "Progress, milestones, and contribution history" },
    { src: "/screens/05-receipts.png", title: "Receipts", caption: "Receipt vault with filters and previews" },
    { src: "/screens/06-analytics.png", title: "Analytics", caption: "Trends, category breakdowns, monthly view" },
    { src: "/screens/07-settings.png", title: "Settings", caption: "Profile, theme, and about/version" },
  ];

  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));

  const featureHighlights = [
    {
      icon: <PiggyBank className="h-6 w-6" />,
      title: "Shared expense tracking",
      description: "50/50 by default with custom splits for edge cases."
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      title: "Receipt vault",
      description: "Upload, store, and view receipts alongside each expense."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Recurring bills",
      description: "Set it once for rent, utilities, and subscriptions."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Settlement engine",
      description: "Instantly shows who owes what, with email confirmation."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Savings goals",
      description: "Progress bars and contribution breakdowns for big milestones."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics",
      description: "Spending trends, category breakdowns, and monthly summaries."
    }
  ];

  const processNotes = [
    {
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      title: "PRD-driven",
      description: "Feature work starts with a short PRD and acceptance criteria."
    },
    {
      icon: <Receipt className="h-5 w-5 text-blue-600" />,
      title: "Receipts feature",
      description: "Users can upload and view receipts per expense plus standalone receipt storage."
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
      description: "React 18, TypeScript, Vite, Tailwind (shadcn UI), Radix primitives."
    },
    {
      icon: <Server className="h-6 w-6 text-blue-600" />,
      title: "Backend & data",
      description: "Convex for data + auth, file storage for receipts, Resend for email."
    },
    {
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      title: "Delivery",
      description: "Bun for install/test/lint, Netlify for hosting, PWA assets & offline-ready."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              AAFairShare
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              2 Users
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private App
            </Badge>
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
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The simplest way for couples to track shared expenses, settle up fairly, and save for life's biggest moments.
          </p>

          <div className="flex flex-col items-center justify-center gap-3">
            <Badge variant="secondary" className="text-base px-6 py-2">
              <Lock className="h-4 w-4 mr-2" />
              Private app for 2 people — portfolio showcase
            </Badge>
            <p className="text-sm text-gray-500 max-w-xl">
              Built to retire our shared Google Sheet and automate settlements without spreadsheets.
            </p>
          </div>
        </div>
      </div>

      {/* What & Why */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Product tour</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">See the app (mobile viewport)</h2>
            <p className="text-gray-600">Captured from demo mode for portfolio review.</p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {slides.map((slide) => (
                  <div key={slide.src} className="min-w-full flex items-center justify-center bg-gray-50 p-6">
                    <div className="w-full max-w-sm shadow-lg rounded-xl overflow-hidden bg-white border border-gray-200">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        loading="lazy"
                        className="w-full h-full object-contain bg-white"
                      />
                    <div className="p-4 border-t">
                      <p className="text-sm font-semibold">{slide.title}</p>
                      <p className="text-xs text-gray-500">{slide.caption}</p>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow hover:bg-gray-50 border"
              onClick={prev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow hover:bg-gray-50 border"
              onClick={next}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  className={`h-2.5 w-2.5 rounded-full ${idx === current ? "bg-blue-600" : "bg-gray-300"}`}
                  aria-label={`Go to slide ${idx + 1}`}
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
            <p className="text-gray-700 text-lg mb-4">
              AAFairShare is a private, two-person finance app I built to replace a messy Excel sheet. It handles daily expenses, recurring bills, settlements, savings goals, and now receipt storage so every purchase is documented.
            </p>
            <p className="text-gray-700 text-lg">
              The goal: zero spreadsheet wrangling, instant “who owes what,” and a clean audit trail when tax season or disputes appear.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-3">Why I built it</h3>
            <Card className="border-blue-100">
              <CardContent className="p-6 space-y-3 text-gray-700">
                <p>• We were reconciling manually in Excel every month; it was brittle and slow.</p>
                <p>• Needed receipts attached to expenses instead of scattered inboxes.</p>
                <p>• Wanted automated settlements and email confirmations without adding more SaaS.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div id="features" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Feature highlights</h2>
            <p className="text-gray-600 text-lg">Built for two people, but engineered like a production app.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
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
            <p className="text-gray-700 mb-4">
              Each feature is scoped with a short PRD (kept private), acceptance criteria, and a post-release checklist. Recent work shipped:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>• Receipt storage and standalone receipt library.</li>
              <li>• Email settlements with validation and logging.</li>
              <li>• Auth guards and input validation for all Convex endpoints.</li>
            </ul>
          </div>
          <div className="space-y-4">
            {processNotes.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5 flex gap-3 items-start">
                  <div className="mt-1">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Recent updates */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Recent updates</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs uppercase text-blue-600 font-semibold">Receipts</div>
                  <div className="font-semibold">Receipt vault & attachments</div>
                  <p className="text-gray-600">Upload/store receipts with expenses or standalone; view and download later.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs uppercase text-blue-600 font-semibold">Reliability</div>
                  <div className="font-semibold">Convex validation</div>
                  <p className="text-gray-600">Centralized auth + date/month/amount validation across all endpoints.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="text-xs uppercase text-blue-600 font-semibold">Build</div>
                  <div className="font-semibold">Bun-first delivery</div>
                  <p className="text-gray-600">Netlify builds via Bun; npm lock removed to match local workflow.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tech stack</h2>
            <p className="text-gray-600 text-lg">Modern, fast, and secure—built to stay maintainable.</p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {techStack.map((item, i) => (
              <Card key={i} className="h-full">
                <CardContent className="p-6 space-y-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
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
            <p className="text-blue-100 text-lg mb-4 max-w-2xl mx-auto">
              AAFairShare is a private application actively used by a couple to manage their shared finances.
              This landing page showcases the features and technology behind it.
            </p>
            <p className="text-white text-base max-w-xl mx-auto">
              Built with React, TypeScript, Convex, Tailwind, Bun, and Netlify — demonstrating modern full-stack delivery without the spreadsheet pain.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2">AAFairShare</h3>
          <p className="text-gray-400 mb-4">Built with ❤️ for couples who share everything</p>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Convex</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            © 2025 AAFairShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
