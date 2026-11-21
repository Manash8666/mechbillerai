'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          garageType: formData.garageType,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Registration successful! 15-day trial activated.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Hyper-Biller Ambient Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9F31D]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#E5C07B]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-md w-full bg-[#151D2F] rounded-3xl p-8 sm:p-10 border border-[#1C263D] shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0B0F19] border-2 border-[#C9F31D]/40 text-[#C9F31D] shadow-[0_0_25px_rgba(201,243,29,0.25)] mb-4">
            <ShieldCheck className="h-9 w-9 text-[#C9F31D]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Get Started
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1.5 tracking-wide">
            Launch your <span className="text-[#C9F31D] font-bold">MotoBan</span> 15-Day Free Trial
          </p>
          <p className="text-[10px] text-[#E5C07B] uppercase tracking-widest font-mono mt-0.5">
            100% Free · No Credit Card Required
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Workshop / Owner Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
                placeholder="MotoFit Workshop"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
                placeholder="garage@motoban.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Workshop Segment
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, garageType: 'two_wheeler' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.garageType === 'two_wheeler'
                    ? 'bg-[#C9F31D] text-[#0B0F19] border-[#C9F31D]'
                    : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D]'
                }`}
              >
                🏍️ Two-Wheeler
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, garageType: 'four_wheeler' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.garageType === 'four_wheeler'
                    ? 'bg-[#C9F31D] text-[#0B0F19] border-[#C9F31D]'
                    : 'bg-[#0B0F19] text-[#94A3B8] border-[#1C263D]'
                }`}
              >
                🚗 Four-Wheeler
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-11 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19] border border-[#1C263D] rounded-xl focus:ring-2 focus:ring-[#C9F31D] focus:border-[#C9F31D] text-white placeholder-[#64748B] text-sm transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#C9F31D] text-[#0B0F19] rounded-xl font-extrabold text-sm hover:bg-[#b8e214] shadow-[0_0_20px_rgba(201,243,29,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader text="Creating" className="p-0 text-[#0B0F19]" />
            ) : (
              <span>Start 15-Day Free Trial →</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#1C263D] text-center">
          <p className="text-xs text-[#94A3B8]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C9F31D] font-bold hover:underline">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
