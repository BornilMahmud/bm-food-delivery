import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, signup, resetPassword, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'signup') {
      if (!name.trim()) { setError('Full Name is required'); return; }
      if (!phone.trim()) { setError('Phone number is required'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (!acceptTerms) { setError('Please accept terms & conditions'); return; }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'signup') {
        await signup(email, password, name, phone, address, photoURL);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="bm-modal-panel relative w-full max-w-md bg-[#111417] rounded-[28px] shadow-[var(--bm-shadow-deep)] overflow-hidden border border-[var(--bm-line)] z-10 my-8">
        {/* Header */}
        <div className="bg-[#0b0e11] border-b border-[var(--bm-line)] p-6 text-[var(--bm-cream)] text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--bm-cream-soft)] hover:text-[var(--bm-ember)] p-1 rounded-full transition hover:bg-[var(--bm-ember)]/10"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login' && 'Welcome Back to BM Food Delivery'}
            {mode === 'signup' && 'Create BM Food Delivery Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-white/90 mt-1 font-medium">
            {mode === 'login' && 'Sign in to order hot food in under 25 mins'}
            {mode === 'signup' && 'Register now to unlock discount coupons & fast tracking'}
            {mode === 'forgot' && 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-[var(--bm-graphite-raised)] focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-[var(--bm-graphite-raised)] focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Phone Number for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+8801711223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-[var(--bm-graphite-raised)] focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Default Address for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Default Delivery Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-[var(--bm-graphite-raised)] focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Password (for login & signup) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-orange-600 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-[var(--bm-graphite-raised)] focus:border-orange-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-[var(--bm-graphite-raised)] focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Terms checkbox for signup */}
          {mode === 'signup' && (
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="terms" className="text-[11px] text-neutral-600 dark:text-neutral-400">
                I agree to the <a href="#" className="text-orange-600 underline">Terms of Service</a> & <a href="#" className="text-orange-600 underline">Privacy Policy</a>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 bg-[var(--bm-ember)] hover:bg-[var(--bm-ember-deep)] text-[var(--bm-ink-deep)] rounded-xl font-bold text-xs shadow-[0_10px_24px_rgba(255,90,31,.22)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Free Account'}
                {mode === 'forgot' && 'Send Reset Email'}
              </>
            )}
          </button>

          {/* Divider */}
          {mode !== 'forgot' && (
            <div className="relative my-2 flex items-center justify-center">
              <div className="border-t border-neutral-200 dark:border-neutral-700 w-full"></div>
              <span className="bg-[#111417] px-3 text-[11px] font-semibold text-neutral-400 absolute">OR</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          {mode !== 'forgot' && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full py-2.5 bg-[var(--bm-graphite-raised)] hover:bg-[var(--bm-graphite-overlay)] text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          )}

          {/* Mode Toggles */}
          <div className="text-center text-xs text-neutral-600 dark:text-neutral-400 pt-2">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-orange-600 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-orange-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
