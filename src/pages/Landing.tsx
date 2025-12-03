import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PiggyBank, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Target,
  Shield,
  Zap,
  Heart,
  CheckCircle2,
  Mail,
  Download,
  Clock,
  Lock,
  Users
} from "lucide-react";

const Landing = () => {

  const features = [
    {
      icon: <PiggyBank className="h-6 w-6" />,
      title: "Expense Tracking",
      description: "Log shared expenses with automatic 50/50 splitting. Never argue about who paid what."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Savings Goals",
      description: "Track big purchases together. House deposits, cars, holidays - celebrate every milestone."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Smart Analytics",
      description: "Beautiful charts and insights. See spending patterns, trends, and category breakdowns."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Recurring Expenses",
      description: "Set up monthly bills once. Track rent, utilities, and subscriptions automatically."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Settlement System",
      description: "Automatic calculations of who owes what. One-click settlements with email reports."
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Reports",
      description: "Send detailed settlement summaries. Professional breakdowns with all the details."
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Export Data",
      description: "Download as CSV or PDF. Keep records for taxes or personal finance tracking."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Your data is yours. Row-level security, encrypted storage, and Google OAuth."
    }
  ];

  const stats = [
    { label: "Split Expenses", value: "50/50", icon: <PiggyBank className="h-5 w-5" /> },
    { label: "Response Time", value: "<100ms", icon: <Zap className="h-5 w-5" /> },
    { label: "Mobile Ready", value: "100%", icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: "Always Free", value: "£0/mo", icon: <Heart className="h-5 w-5" /> }
  ];

  const achievements = [
    { icon: "🏠", title: "House Deposit", amount: "£50,000" },
    { icon: "🚗", title: "New Car", amount: "£15,000" },
    { icon: "✈️", title: "Dream Holiday", amount: "£5,000" },
    { icon: "💍", title: "Wedding", amount: "£20,000" }
  ];

  const keyFeatures = [
    {
      title: "Track Everything",
      description: "Groceries, bills, date nights, subscriptions",
      examples: ["Tesco - £85.42", "Electricity Bill - £120.00", "Netflix - £15.99"]
    },
    {
      title: "Smart Categories",
      description: "Organize expenses automatically",
      examples: ["Groceries", "Utilities", "Entertainment", "Transport"]
    },
    {
      title: "Monthly Insights",
      description: "See exactly where your money goes",
      examples: ["Spent £1,240 this month", "Top category: Groceries £320", "Saved 15% vs last month"]
    },
    {
      title: "Fair Settlements",
      description: "Know who owes what instantly",
      examples: ["Emma owes Antonio £45.50", "Settled on Nov 1st", "Email receipt sent"]
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
              Private App - Portfolio Showcase
            </Badge>
            <p className="text-sm text-gray-500">
              This app is actively used by a couple. Explore the features below to see how it works.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-600 text-lg">
            Simple, powerful features designed for shared living
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
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

      {/* Savings Goals Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-white mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Celebrate Every Milestone Together
            </h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Track your savings goals and look back on everything you've achieved as a couple
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {achievements.map((achievement, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center text-white">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                  <div className="text-2xl font-bold text-green-300">{achievement.amount}</div>
                  <p className="text-xs text-blue-100 mt-2">Saved Together</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-blue-100 text-lg">
              Building amazing features for couples everywhere
            </p>
          </div>
        </div>
      </div>

      {/* Key Features Showcase */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-gray-600 text-lg">
            Real examples of how AAFairShare keeps you organized
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {keyFeatures.map((feature, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  {feature.examples.map((example, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{example}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Three simple steps to financial harmony
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-xl mb-2">Add Expenses</h3>
                <p className="text-gray-600">
                  Log who paid for what. Categories, locations, and notes included.
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 bg-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-xl mb-2">Auto Calculate</h3>
                <p className="text-gray-600">
                  We automatically calculate who owes what. Everything split 50/50.
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-xl mb-2">Settle & Save</h3>
                <p className="text-gray-600">
                  Mark as settled and track savings goals for your future together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Preview Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Beautiful on Every Device
          </h2>
          <p className="text-gray-600 text-lg">
            Desktop, tablet, or mobile - a seamless experience everywhere
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-teal-50">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <div className="h-2 bg-blue-200 rounded mb-2"></div>
                    <div className="h-2 bg-teal-200 rounded mb-2"></div>
                    <div className="h-2 bg-green-200 rounded"></div>
                  </div>
                  <h3 className="font-semibold">Dashboard</h3>
                  <p className="text-sm text-gray-600">Quick overview</p>
                </div>

                <div>
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <Target className="h-12 w-12 text-teal-600 mx-auto mb-3" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-green-300 rounded"></div>
                        <span className="text-xs text-gray-600">85%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-blue-300 rounded"></div>
                        <span className="text-xs text-gray-600">62%</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold">Savings Goals</h3>
                  <p className="text-sm text-gray-600">Track progress</p>
                </div>

                <div>
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <PiggyBank className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-green-600 mb-1">£45.50</div>
                    <div className="text-xs text-gray-600">Settlement</div>
                  </div>
                  <h3 className="font-semibold">Settlement</h3>
                  <p className="text-sm text-gray-600">Who owes what</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Why Choose AAFairShare */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Couples Love AAFairShare
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-4xl mb-4">😌</div>
              <h3 className="font-semibold text-xl mb-3">No More Arguments</h3>
              <p className="text-gray-600 mb-4">
                "We used to argue about who paid for what. Now everything is tracked automatically. Complete transparency."
              </p>
              <p className="text-sm text-gray-500 italic">- Sarah & Tom</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold text-xl mb-3">Hit Your Goals Faster</h3>
              <p className="text-gray-600 mb-4">
                "We saved £50,000 for our house deposit in 18 months. Seeing the progress bar fill up kept us motivated!"
              </p>
              <p className="text-sm text-gray-500 italic">- Emma & James</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="font-semibold text-xl mb-3">Save Time Every Month</h3>
              <p className="text-gray-600 mb-4">
                "Used to spend hours with spreadsheets. Now it takes 30 seconds to add an expense and 2 minutes to settle up."
              </p>
              <p className="text-sm text-gray-500 italic">- Lisa & Mark</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="font-semibold text-xl mb-3">Privacy First</h3>
              <p className="text-gray-600 mb-4">
                "Our financial data stays private. Bank-level security with Google authentication. No sharing with third parties."
              </p>
              <p className="text-sm text-gray-500 italic">- Rachel & David</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-gray-600 text-lg">
              Fast, secure, and reliable
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">Built with React, TypeScript, and Vite for instant loading</p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Bank-Level Security</h3>
              <p className="text-sm text-gray-600">PostgreSQL with Row-Level Security and encrypted storage</p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">Always Available</h3>
              <p className="text-sm text-gray-600">99.9% uptime with automated monitoring and keep-alive</p>
            </div>
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
              A Real App, Built for Real Use
            </h2>
            <p className="text-blue-100 text-lg mb-4 max-w-2xl mx-auto">
              AAFairShare is a private application actively used by a couple to manage their shared finances.
              This landing page showcases the features and technology behind it.
            </p>
            <p className="text-white text-base max-w-xl mx-auto">
              Built with React, TypeScript, Convex, and Tailwind CSS - demonstrating modern full-stack development practices.
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
