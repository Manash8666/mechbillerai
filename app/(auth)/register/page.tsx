'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    garageType: 'four_wheeler',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          garageType: formData.garageType,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Registration successful! 7-day trial activated.');
      
      // Show license key
      alert(`Your License Key: ${data.user.licenseKey}\n\nPlease save this key. You'll need it to activate your account.`);
      
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-canvas-light dark:bg-luxury-canvas-dark flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-2xl shadow-2xl p-8 border border-luxury-gold/20">
        <div className="flex justify-center mb-6">
          <Car className="h-12 w-12 text-luxury-gold" />
        </div>
        <h1 className="text-3xl font-bold text-center text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
          Get Started
        </h1>
        <p className="text-center text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-8">
          Create your MotoBan account · Powered by Hybrid StudioZ
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
              Phone
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark transition-all"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-3">
              Garage Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.garageType === 'two_wheeler'
                    ? 'border-luxury-gold bg-luxury-gold/10'
                    : 'border-luxury-muted-light/30 hover:border-luxury-gold/50'
                }`}
              >
                <input
                  type="radio"
                  name="garageType"
                  value="two_wheeler"
                  checked={formData.garageType === 'two_wheeler'}
                  onChange={(e) =>
                    setFormData({ ...formData, garageType: e.target.value })
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">🏍️</div>
                  <div className="text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark">
                    Two-Wheeler
                  </div>
                  <div className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                    Bikes & Scooters
                  </div>
                </div>
                {formData.garageType === 'two_wheeler' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-luxury-gold rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              <label
                className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.garageType === 'four_wheeler'
                    ? 'border-luxury-gold bg-luxury-gold/10'
                    : 'border-luxury-muted-light/30 hover:border-luxury-gold/50'
                }`}
              >
                <input
                  type="radio"
                  name="garageType"
                  value="four_wheeler"
                  checked={formData.garageType === 'four_wheeler'}
                  onChange={(e) =>
                    setFormData({ ...formData, garageType: e.target.value })
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark">
                    Four-Wheeler
                  </div>
                  <div className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                    Cars & SUVs
                  </div>
                </div>
                {formData.garageType === 'four_wheeler' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-luxury-gold rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-2 bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-muted-light/30 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-ink-light dark:text-luxury-ink-dark transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-luxury-gold text-luxury-ink-light rounded-lg font-semibold hover:bg-luxury-gold-light hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-luxury-gold hover:text-luxury-gold-light font-medium transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
