import Link from "next/link";
import { Car, ClipboardList, Package, TrendingUp, Users, Calendar, Sparkles, ShieldCheck } from "lucide-react";

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

        {/* Official Commercial Pricing Tiers */}
        <div className="mt-16 space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/15 border border-royal-gold/30 text-royal-gold text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Official Commercial Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-pure-white tracking-tight">
              Simple, Predictable Plans for Every Garage
            </h2>
            <p className="text-cool-slate mt-3 text-sm sm:text-base">
              Start with our 15-Day Free Trial. Upgrade anytime to unlock unlimited daily bills, GST invoices, and cloud sync.
            </p>
          </div>

          {/* 15-Day Free Trial Banner */}
          <div className="bg-navy-steel/90 rounded-2xl p-6 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-pure-white">15-Day Free Trial</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-cool-slate mt-1">
                  Test drive MotoBan with up to 2 Bills, 2 Estimates, and 2 Job Cards per day. No credit card required.
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-geek-lime text-void-black text-xs font-bold rounded-xl hover:bg-geek-lime-hover hover:shadow-lime-glow transition-all whitespace-nowrap shrink-0"
            >
              Start 15-Day Free Trial →
            </Link>
          </div>

          {/* 4 Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Monthly Plan */}
            <div className="bg-navy-steel rounded-2xl p-6 border border-deep-glass flex flex-col justify-between hover:border-royal-gold/40 transition-all">
              <div>
                <span className="text-xs font-bold text-cool-slate uppercase tracking-wider">Month-to-Month</span>
                <h4 className="text-xl font-bold text-pure-white mt-1">Monthly Plan</h4>
                <p className="text-xs text-cool-slate mt-1">Flexible garage billing</p>
                <div className="mt-4 pb-4 border-b border-deep-glass">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-pure-white font-mono">₹1,299</span>
                    <span className="text-xs text-cool-slate">/ month</span>
                  </div>
                  <span className="text-[11px] text-steel-dim mt-0.5 block">Billed monthly</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-cool-slate">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Unlimited Invoices & Job Cards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Standee UPI QR Code on Bills
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> 1-Tap WhatsApp Receipt Dispatch
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Thermal Printer 58mm/80mm Sync
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Up to 5 Staff User Accounts
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-6 block w-full py-2.5 text-center text-xs font-bold bg-deep-glass hover:bg-royal-gold/20 text-pure-white border border-royal-gold/30 rounded-xl transition-all"
              >
                Choose Monthly
              </Link>
            </div>

            {/* 2. Quarterly Plan */}
            <div className="bg-navy-steel rounded-2xl p-6 border border-deep-glass flex flex-col justify-between hover:border-royal-gold/40 transition-all relative">
              <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Save 15%
              </div>
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Quarterly</span>
                <h4 className="text-xl font-bold text-pure-white mt-1">Quarterly Plan</h4>
                <p className="text-xs text-cool-slate mt-1">₹3,297 billed every 3 months</p>
                <div className="mt-4 pb-4 border-b border-deep-glass">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-pure-white font-mono">₹1,099</span>
                    <span className="text-xs text-cool-slate">/ mo effective</span>
                  </div>
                  <span className="text-[11px] text-blue-400 mt-0.5 block">Save ₹600 vs monthly</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-cool-slate">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Everything in Monthly Plan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Automated WhatsApp Reminders
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> 4-Sided Dent Photo Shield
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Customer Credit & Ledger History
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Priority Support Desk
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-6 block w-full py-2.5 text-center text-xs font-bold bg-deep-glass hover:bg-royal-gold/20 text-pure-white border border-royal-gold/30 rounded-xl transition-all"
              >
                Choose Quarterly
              </Link>
            </div>

            {/* 3. Annual Pro (Most Popular) */}
            <div className="bg-navy-steel rounded-2xl p-6 border-2 border-royal-gold shadow-2xl flex flex-col justify-between hover:scale-[1.02] transition-all relative">
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-bold bg-royal-gold text-void-black shadow-md uppercase tracking-wider">
                ★ Best Value · Save 31%
              </div>
              <div>
                <span className="text-xs font-bold text-royal-gold uppercase tracking-wider">Yearly Access</span>
                <h4 className="text-xl font-bold text-pure-white mt-1">Annual Pro</h4>
                <p className="text-xs text-cool-slate mt-1">₹10,788 billed yearly (Just ₹29/day)</p>
                <div className="mt-4 pb-4 border-b border-royal-gold/20">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-royal-gold font-mono">₹899</span>
                    <span className="text-xs text-cool-slate">/ mo effective</span>
                  </div>
                  <span className="text-[11px] text-emerald-sync font-bold mt-0.5 block">Save ₹4,800 annually</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-cool-slate">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Everything in Quarterly Plan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Free Custom Subdomain (.motoban.in)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Indian VAHAN / RTO Plate Decoder
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Low-Stock & Auto-Reorder Alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> VIP 24/7 Priority Concierge
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-6 block w-full py-3 text-center text-xs font-bold bg-geek-lime text-void-black hover:bg-geek-lime-hover hover:shadow-lime-glow rounded-xl transition-all"
              >
                Get Annual Pro
              </Link>
            </div>

            {/* 4. One-Time Perpetual License */}
            <div className="bg-navy-steel rounded-2xl p-6 border border-purple-500/30 shadow-xl flex flex-col justify-between hover:border-purple-400 transition-all relative">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-sm">
                Zero Renewal Fees
              </div>
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Perpetual</span>
                <h4 className="text-xl font-bold text-pure-white mt-1">One-Time License</h4>
                <p className="text-xs text-cool-slate mt-1">Lifetime license with 2 years updates</p>
                <div className="mt-4 pb-4 border-b border-deep-glass">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-pure-white font-mono">₹15,999</span>
                    <span className="text-xs text-cool-slate">one-time</span>
                  </div>
                  <span className="text-[11px] text-purple-400 mt-0.5 block">Commercial Lifetime Ownership</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-cool-slate">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> 100% Commercial Lifetime Access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> 2 Years Guaranteed Feature Drops
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Local Offline Vault Mode (Air-gapped)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Up to 5 Staff User Accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-sync font-bold">✓</span> Zero Monthly or Yearly Subscriptions
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-6 block w-full py-2.5 text-center text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-md"
              >
                Claim Lifetime License
              </Link>
            </div>
          </div>

          {/* Add-ons Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-deep-glass">
            <div className="p-4 rounded-xl bg-navy-steel/60 border border-deep-glass flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-pure-white">Multi-Location / Franchise Branch</h5>
                <p className="text-[11px] text-cool-slate">Centralized reporting, shared vehicle histories, & multi-bay transfers</p>
              </div>
              <span className="text-xs font-mono font-bold text-royal-gold whitespace-nowrap ml-4">₹6,999 / shop</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-steel/60 border border-deep-glass flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-pure-white">Extra Staff User Seats</h5>
                <p className="text-[11px] text-cool-slate">Independent mechanic logins with role-based bay permissions</p>
              </div>
              <span className="text-xs font-mono font-bold text-royal-gold whitespace-nowrap ml-4">₹1,599 / user</span>
            </div>
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
