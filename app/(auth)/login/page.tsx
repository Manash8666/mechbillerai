'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user data in localStorage (in production, use proper session management)
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user.id);
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-canvas-light dark:bg-luxury-canvas-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-luxury-surface-light dark:bg-luxury-surface-dark rounded-2xl shadow-2xl p-8 border border-luxury-gold/20">
        <div className="flex justify-center mb-6">
          <Car className="h-12 w-12 text-luxury-gold" />
        </div>
        <h1 className="text-3xl font-bold text-center text-luxury-ink-light dark:text-luxury-ink-dark mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-8">
          Login to your MotoBan account · Powered by Hybrid StudioZ
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-luxury-ink-light/60 dark:text-luxury-ink-dark/60 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-luxury-gold hover:text-luxury-gold-light font-medium transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
