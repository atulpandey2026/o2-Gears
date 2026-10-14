'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message ?? 'Login failed. Please check your credentials.');
      } else {
        router.push('/');
      }
    } else {
      if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, fullName);
      if (err) {
        setError(err.message ?? 'Registration failed. Please try again.');
      } else {
        setSuccess('Account created! Please check your email to verify your account, then log in.');
        setMode('login');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #C8E6F5 40%, #A8D8F0 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <AppLogo size={48} />
            <span className="font-display font-bold text-2xl text-primary">O2 Gears</span>
          </Link>
          <p className="text-sm text-muted-foreground">Smart Accessories • Better Living</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-border p-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Create Account
            </button>
          </div>

          <h2 className="font-display font-bold text-xl text-primary mb-1">
            {mode === 'login' ? 'Welcome back' : 'Join O2 Gears'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === 'login' ? 'Sign in to your account to continue.' : 'Create your account to start shopping.'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4 flex items-center gap-2">
              <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-600 mb-4 flex items-center gap-2">
              <Icon name="CheckCircleIcon" size={16} className="text-green-500 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Priya Sharma"
                  required
                  className="input-o2"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-o2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="input-o2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Icon name="ArrowPathIcon" size={16} className="text-white animate-spin" />
              ) : (
                <Icon name={mode === 'login' ? 'ArrowRightOnRectangleIcon' : 'UserPlusIcon'} size={16} className="text-white" />
              )}
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-4 bg-muted/60 rounded-2xl border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => { setEmail('admin@o2gears.com'); setPassword('admin123'); setMode('login'); }}
                className="text-left text-xs text-foreground hover:text-accent transition-colors"
              >
                <span className="font-semibold">Admin:</span> admin@o2gears.com / admin123
              </button>
              <button
                onClick={() => { setEmail('user@o2gears.com'); setPassword('user123'); setMode('login'); }}
                className="text-left text-xs text-foreground hover:text-accent transition-colors"
              >
                <span className="font-semibold">Customer:</span> user@o2gears.com / user123
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/" className="hover:text-accent transition-colors">← Back to Store</Link>
        </p>
      </div>
    </div>
  );
}
