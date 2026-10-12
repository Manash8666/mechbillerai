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
              <h1 className="text-2xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                Garage SaaS
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-luxury-ink-light dark:text-luxury-ink-dark hover:text-luxury-gold font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-luxury-gold text-luxury-ink-light rounded-lg hover:bg-luxury-gold-light hover:shadow-lg font-medium transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
            Complete Garage Management System
          </h2>
          <p className="text-xl text-luxury-ink-light/80 dark:text-luxury-ink-dark/80 mb-8">
            One-time fee, lifetime access. Built for Ahmedabad garage owners.
          </p>
          <p className="text-lg text-luxury-gold mb-8 font-medium">
            ગેરેજ માલિકો માટે સંપૂર્ણ સોલ્યુશન (Complete Solution for Garage Owners)
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-luxury-gold text-luxury-ink-light text-lg font-semibold rounded-lg hover:bg-luxury-gold-light hover:shadow-2xl shadow-lg transition-all duration-300"
          >
            Start Your Free Trial
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Users className="h-12 w-12 text-luxury-gold" />}
            title="Customer Management"
            description="Track customers, vehicles, and complete service history in one place"
            gujarati="ગ્રાહક અને વાહન માહિતી"
          />
          <FeatureCard
            icon={<ClipboardList className="h-12 w-12 text-luxury-gold" />}
            title="GST Billing"
            description="Generate GST-compliant invoices with multiple payment modes"
            gujarati="GST બિલિંગ સિસ્ટમ"
          />
          <FeatureCard
            icon={<Package className="h-12 w-12 text-luxury-gold" />}
            title="Inventory Management"
            description="Track parts, stock levels, and get low stock alerts"
            gujarati="ઇન્વેન્ટરી મેનેજમેન્ટ"
          />
          <FeatureCard
            icon={<Car className="h-12 w-12 text-luxury-gold" />}
            title="Job Cards"
            description="Digital job cards with checklists and status tracking"
            gujarati="ડિજિટલ જોબ કાર્ડ"
          />
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-luxury-gold" />}
            title="Appointments"
            description="Schedule services with calendar view and reminders"
            gujarati="એપોઇન્ટમેન્ટ બુકિંગ"
          />
          <FeatureCard
            icon={<TrendingUp className="h-12 w-12 text-luxury-gold" />}
            title="Reports & Analytics"
            description="Get insights with sales reports and performance metrics"
            gujarati="રિપોર્ટ અને વિશ્લેષણ"
          />
        </div>

        {/* Pricing Section */}
        <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-2xl shadow-2xl p-8 md:p-12 text-center border border-luxury-gold/20">
          <h3 className="text-3xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark mb-4">
            One-Time Payment. Lifetime Access.
          </h3>
          <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-8">
            No monthly fees. No hidden costs. Pay once, use forever.
          </p>
          <div className="inline-block">
            <div className="text-5xl font-extrabold text-luxury-gold mb-2">
              ₹9,999
            </div>
            <div className="text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mb-6">One-time payment</div>
            <ul className="text-left space-y-3 mb-8 text-luxury-ink-light dark:text-luxury-ink-dark">
              <li className="flex items-center">
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-2">✓</span>
                Unlimited customers & vehicles
              </li>
              <li className="flex items-center">
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-2">✓</span>
                Unlimited invoices & job cards
              </li>
              <li className="flex items-center">
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-2">✓</span>
                English & Gujarati support
              </li>
              <li className="flex items-center">
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-2">✓</span>
                Free updates forever
              </li>
              <li className="flex items-center">
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-2">✓</span>
                WhatsApp integration
              </li>
              <li className="flex items-center">
                <span className="text-luxury-semantic-success-light dark:text-luxury-semantic-success-dark mr-2">✓</span>
                Offline mode support
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full px-8 py-4 bg-luxury-gold text-luxury-ink-light text-lg font-semibold rounded-lg hover:bg-luxury-gold-light hover:shadow-2xl transition-all duration-300"
            >
              Get Your License Now
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-luxury-surface-light dark:bg-luxury-surface-dark border-t border-luxury-muted-light/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
            © 2026 Garage SaaS. Made with ❤️ for Ahmedabad Garage Owners.
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
    <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-xl shadow-md p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-luxury-gold/10">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
        {title}
      </h3>
      <p className="text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-2">
        {description}
      </p>
      <p className="text-sm text-luxury-gold font-medium">{gujarati}</p>
    </div>
  );
}
