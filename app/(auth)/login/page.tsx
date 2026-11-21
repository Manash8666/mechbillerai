'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Wrench, Crown, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';

type UserRole = 'owner' | 'manager' | 'mechanic';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Preserve or set user session with role segregation
      const user = {
        ...data.user,
        activeRole: selectedRole || data.user.role || 'owner',
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
      if (data.token) {
        localStorage.setItem('motoban_token', data.token);
      }

      toast.success(`Welcome back, ${user.name}!`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Hyper-Biller Ambient Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9F31D]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#E5C07B]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-md w-full bg-[#151D2F] rounded-3xl p-8 sm:p-10 border border-[#1C263D] shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Icon & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0B0F19] border-2 border-[#C9F31D]/40 text-[#C9F31D] shadow-[0_0_25px_rgba(201,243,29,0.25)] mb-4">
            <ShieldCheck className="h-9 w-9 text-[#C9F31D]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1.5 tracking-wide">
            Sign in to your <span className="text-[#C9F31D] font-bold">MotoBan</span> Production Account
          </p>
          <p className="text-[10px] text-[#E5C07B] uppercase tracking-widest font-mono mt-0.5">
            Powered by Hybrid StudioZ
          </p>
        </div>

        {/* Role-Based Segregation Selector */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2.5">
            Select Your Workshop Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                selectedRole === 'owner'
                  ? 'bg-[#C9F31D] text-[#0B0F19] border-[#C9F31D] shadow-[0_0_15px_rgba(201,243,29,0.35)]'
                  : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D] hover:border-[#C9F31D]/40'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Owner</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('manager')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                selectedRole === 'manager'
                  ? 'bg-[#E5C07B] text-[#0B0F19] border-[#E5C07B] shadow-[0_0_15px_rgba(229,192,123,0.35)]'
                  : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D] hover:border-[#E5C07B]/40'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Manager</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('mechanic')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                selectedRole === 'mechanic'
                  ? 'bg-[#FF5E14] text-white border-[#FF5E14] shadow-[0_0_15px_rgba(255,94,20,0.35)]'
                  : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D] hover:border-[#FF5E14]/40'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Technician</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
                placeholder="garage@motoban.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-11 py-3 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#C9F31D] text-[#0B0F19] rounded-xl font-extrabold text-sm hover:bg-[#b8e214] shadow-[0_0_20px_rgba(201,243,29,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader text="Authenticating" className="p-0 text-[#0B0F19]" />
            ) : (
              <span>Sign In as {selectedRole.toUpperCase()}</span>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-[#1C263D] text-center space-y-3">
          <p className="text-xs text-[#94A3B8]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#C9F31D] font-bold hover:underline">
              Start 15-Day Free Trial →
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>Cloud Production Engine · app.motoban.in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
