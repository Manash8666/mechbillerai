import Link from "next/link";
import { Car, ClipboardList, Package, TrendingUp, Users, Calendar } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-luxury-canvas-light dark:bg-luxury-canvas-dark">
      {/* Header */}
      <header className="bg-luxury-surface-light dark:bg-luxury-surface-dark shadow-sm border-b border-luxury-muted-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-luxury-gold" />
              <div>
                <h1 className="text-2xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                  MotoBan
                </h1>
                <p className="text-[10px] text-luxury-gold tracking-wider uppercase font-semibold">
                  Powered by Hybrid StudioZ
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-cool-slate hover:text-geek-lime font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-geek-lime text-void-black rounded-lg hover:bg-geek-lime-hover hover:shadow-lime-glow font-bold transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Hyper-Biller Ambient Glow */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="absolute inset-0 hyper-biller-glow pointer-events-none -z-10" />
        
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-steel border border-deep-glass text-xs font-semibold text-geek-lime mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-geek-lime animate-pulse" />
            <span>MotoBan v3.0 Production Engine • Ahmedabad Lab</span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-extrabold text-pure-white mb-4 tracking-tight">
            AI Garage POS & Billing Platform
          </h2>
          <p className="text-xl text-cool-slate mb-4 max-w-2xl mx-auto">
            Engineered for greasy garage bays and executive digital precision. Fast GST invoices, job cards & telemetry.
          </p>
          <p className="text-base text-royal-gold mb-8 font-medium">
            ગેરેજ માલિકો માટે સંપૂર્ણ સોલ્યુશન (Complete Solution for Garage Owners)
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-geek-lime text-void-black text-lg font-bold rounded-xl hover:bg-geek-lime-hover hover:shadow-lime-glow shadow-lg transition-all duration-300"
            >
              Start Free Trial (Geek Lime CTA)
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-navy-steel border border-deep-glass text-pure-white text-lg font-semibold rounded-xl hover:border-geek-lime/40 transition-all duration-300"
            >
              Launch Terminal
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Users className="h-12 w-12 text-geek-lime" />}
            title="Customer Management"
            description="Track customers, vehicles, and complete service history in one place"
            gujarati="ગ્રાહક અને વાહન માહિતી"
          />
          <FeatureCard
            icon={<ClipboardList className="h-12 w-12 text-emerald-sync" />}
            title="GST Billing"
            description="Generate GST-compliant invoices with multiple payment modes"
            gujarati="GST બિલિંગ સિસ્ટમ"
          />
          <FeatureCard
            icon={<Package className="h-12 w-12 text-garage-orange" />}
            title="Inventory Management"
            description="Track parts, stock levels, and get low stock alerts"
            gujarati="ઇન્વેન્ટરી મેનેજમેન્ટ"
          />
          <FeatureCard
            icon={<Car className="h-12 w-12 text-geek-lime" />}
            title="Job Cards"
            description="Digital job cards with checklists and status tracking"
            gujarati="ડિજિટલ જોબ કાર્ડ"
          />
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-amber-alert" />}
            title="Appointments"
            description="Schedule services with calendar view and reminders"
            gujarati="એપોઇન્ટમેન્ટ બુકિંગ"
          />
          <FeatureCard
            icon={<TrendingUp className="h-12 w-12 text-cobalt-ai" />}
            title="Reports & Analytics"
            description="Get insights with sales reports and performance metrics"
            gujarati="રિપોર્ટ અને વિશ્લેષણ"
          />
        </div>

        {/* Pricing Section (Lifetime Tier Specification) */}
        <div className="bg-navy-steel rounded-2xl shadow-2xl p-8 md:p-12 text-center border border-deep-glass relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/15 border border-royal-gold/30 text-royal-gold text-xs font-bold uppercase tracking-wider mb-4">
            <span>VIP Lifetime Partner Tier</span>
          </div>
          <h3 className="text-3xl font-bold text-pure-white mb-4">
            One-Time Payment. Lifetime License.
          </h3>
          <p className="text-cool-slate mb-8 max-w-xl mx-auto">
            No monthly fees. No hidden costs. Pay once, use forever in your garage bays.
          </p>
          <div className="inline-block max-w-md w-full">
            <div className="text-5xl font-extrabold text-royal-gold mb-2 font-mono">
              ₹6,999 / ₹9,999
            </div>
            <div className="text-steel-dim mb-6 text-sm">One-time commercial license</div>
            <ul className="text-left space-y-3 mb-8 text-pure-white text-sm">
              <li className="flex items-center">
                <span className="text-emerald-sync mr-2 font-bold">✓</span>
                Unlimited customers, vehicles & chassis lookup
              </li>
              <li className="flex items-center">
                <span className="text-emerald-sync mr-2 font-bold">✓</span>
                Instant GST invoices & digital job cards
              </li>
              <li className="flex items-center">
                <span className="text-emerald-sync mr-2 font-bold">✓</span>
                English & Gujarati bi-lingual workshop interface
              </li>
              <li className="flex items-center">
                <span className="text-emerald-sync mr-2 font-bold">✓</span>
                Free updates forever & offline PWA terminal
              </li>
              <li className="flex items-center">
                <span className="text-emerald-sync mr-2 font-bold">✓</span>
                Direct WhatsApp automated receipt delivery
              </li>
              <li className="flex items-center">
                <span className="text-emerald-sync mr-2 font-bold">✓</span>
                Thermal printer (58mm / 80mm ESC/POS) instant sync
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full px-8 py-4 bg-geek-lime text-void-black text-lg font-bold rounded-xl hover:bg-geek-lime-hover hover:shadow-lime-glow transition-all duration-300"
            >
              Claim Lifetime License Now
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-luxury-surface-light dark:bg-luxury-surface-dark border-t border-luxury-muted-light/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
            © 2026 MotoBan. Powered by Hybrid StudioZ. Made with ❤️ for Auto Workshops & Garages.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gujarati,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gujarati: string;
}) {
  return (
    <div className="bg-navy-steel rounded-xl shadow-md p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-deep-glass">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-pure-white mb-2">
        {title}
      </h3>
      <p className="text-cool-slate mb-2">
        {description}
      </p>
      <p className="text-sm text-royal-gold font-medium">{gujarati}</p>
    </div>
  );
}
