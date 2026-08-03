import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Mail, Phone, Lock, User, CheckCircle2, 
  Smartphone, Apple, ArrowRight, Shield, RefreshCw, Key, LogIn
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

// Predefined mock avatars for Google signup simulation
const MOCK_GOOGLE_AVATARS = [
  { name: 'Alex Johnson', email: 'alex.j@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
  { name: 'Jordan Carter', email: 'jordan.carter99@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
  { name: 'Taylor Swift', email: 'taylor.s@gmail.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces' }
];

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'intro' | 'options' | 'google' | 'apple' | 'email' | 'phone' | 'otp' | 'success';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { updateUser, googleSignIn } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [loading, setLoading] = useState(false);
  
  // Input fields state
  const [emailName, setEmailName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+1');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');

  // Built profile details to transition to success state
  const [finalProfile, setFinalProfile] = useState<{
    displayName: string;
    email: string;
    photoURL: string | null;
    isAnonymous: boolean;
    providerId: string;
  } | null>(null);

  // Intro continue
  const handleNextFromIntro = () => {
    setStep('options');
  };

  // Skip and continue as Guest
  const handleContinueAsGuest = () => {
    setLoading(true);
    setTimeout(() => {
      const guestUser = {
        uid: 'guest-' + Math.random().toString(36).substr(2, 9),
        email: 'guest@serene.app',
        displayName: 'Guest Explorer',
        photoURL: null,
        isAnonymous: true,
        providerId: 'guest'
      };
      updateUser(guestUser);
      onComplete();
      setLoading(false);
    }, 600);
  };

  const handleRealGoogleSignIn = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        setFinalProfile({
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
          isAnonymous: false,
          providerId: 'google.com'
        });
        setStep('success');
      }
    } catch (err: any) {
      console.error('Google Sign In Failed', err);
      setErrorText(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Google sign in choice
  const handleGoogleSelect = (avatar: typeof MOCK_GOOGLE_AVATARS[0]) => {
    setLoading(true);
    setTimeout(() => {
      setFinalProfile({
        displayName: avatar.name,
        email: avatar.email,
        photoURL: avatar.avatar,
        isAnonymous: false,
        providerId: 'google.com'
      });
      setLoading(false);
      setStep('success');
    }, 1200);
  };

  const handleCustomGoogleSignIn = (name: string, email: string) => {
    if (!name || !email) {
      setErrorText('Please enter your details');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setFinalProfile({
        displayName: name,
        email: email,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        isAnonymous: false,
        providerId: 'google.com'
      });
      setLoading(false);
      setStep('success');
    }, 1200);
  };

  // Apple sign in action
  const handleAppleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setFinalProfile({
        displayName: 'Apple Member',
        email: 'apple.user@icloud.com',
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=Apple`,
        isAnonymous: false,
        providerId: 'apple.com'
      });
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  // Email Register or Login
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!emailAddress.includes('@')) {
      setErrorText('Please enter a valid email address');
      return;
    }
    if (emailPassword.length < 6) {
      setErrorText('Password must be at least 6 characters');
      return;
    }
    if (!isLoginMode && !emailName.trim()) {
      setErrorText('Please enter your full name');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setFinalProfile({
        displayName: isLoginMode ? (emailAddress.split('@')[0]) : emailName,
        email: emailAddress,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emailName || emailAddress)}`,
        isAnonymous: false,
        providerId: 'password'
      });
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  // Phone code prompt
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setErrorText('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulate random 6-digit OTP code to show the user
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setReceivedOtp(code);
      setLoading(false);
      setStep('otp');
    }, 1200);
  };

  // OTP verify
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userOtpInput === receivedOtp || userOtpInput === '123456') {
      setLoading(true);
      setTimeout(() => {
        setFinalProfile({
          displayName: `Member ${phoneCountry} ${phoneNumber.slice(-4)}`,
          email: `${phoneCountry}${phoneNumber}@phone.serene.app`,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${phoneNumber}`,
          isAnonymous: false,
          providerId: 'phone'
        });
        setLoading(false);
        setStep('success');
      }, 1000);
    } else {
      setErrorText('Verification code incorrect. Try matching the suggested code, or enter "123456"!');
    }
  };

  // Save details and let the user access the main application
  const handleEnterApp = () => {
    if (finalProfile) {
      updateUser(finalProfile);
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#F2EDE2] dark:bg-slate-950 flex shadow-2xl items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm min-h-[560px] max-h-[92vh] md:max-h-none flex flex-col justify-between bg-[#FAF6EE] dark:bg-slate-900 border border-amber-950/10 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Aesthetic Background Accents */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 dark:bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-12 left-0 w-40 h-40 bg-[#B3A183]/10 dark:bg-indigo-950/20 rounded-full blur-3xl pointer-events-none" />

        {/* Transition area */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* 1. INTRO STEP */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6 my-auto"
              >
                <div className="inline-flex p-4 rounded-[1.8rem] bg-amber-950/5 dark:bg-slate-800 border border-amber-950/10 dark:border-slate-700 mx-auto text-primary">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-black tracking-tight text-amber-950 dark:text-neutral-50 uppercase">
                    Serene Structure
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B3A183]">
                    Structure your life with serenity.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed px-2 font-serif">
                  A peaceful, custom space to plan routines, track daily health indices, write in reflection journals, and focus on what truly matters.
                </p>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleNextFromIntro}
                    className="w-full py-4 bg-amber-950 dark:bg-indigo-600 hover:brightness-110 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleContinueAsGuest}
                    className="w-full py-3 bg-transparent text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Skip to Guest Mode
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. ACCOUNT CREATE OPTIONS SCREEN */}
            {step === 'options' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 my-auto"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Welcome</h2>
                  <h3 className="text-lg font-bold text-amber-950 dark:text-neutral-50">Create your account</h3>
                  <p className="text-[11px] text-muted-foreground font-serif">Sync data across devices to preserve memory logs.</p>
                </div>

                <div className="space-y-3 pt-2">
                  
                  {/* Google */}
                  <button
                    onClick={handleRealGoogleSignIn}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-amber-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-amber-950/10 dark:border-slate-800 rounded-2xl text-xs font-bold text-amber-950 dark:text-neutral-200 transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#DE5246]/10 flex items-center justify-center font-black text-[#DE5246] text-xs">G</span>
                      <span>Sign in with Google</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </button>

                  {/* Apple */}
                  <button
                    onClick={() => setStep('apple')}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-amber-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-amber-950/10 dark:border-slate-800 rounded-2xl text-xs font-bold text-amber-950 dark:text-neutral-200 transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <Apple className="w-5 h-5 text-black dark:text-white" />
                      <span>Sign in with Apple</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </button>

                  {/* Email */}
                  <button
                    onClick={() => {
                      setIsLoginMode(false);
                      setStep('email');
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-amber-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-amber-950/10 dark:border-slate-800 rounded-2xl text-xs font-bold text-amber-950 dark:text-neutral-200 transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-amber-800 dark:text-indigo-400" />
                      <span>Continue with Email</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </button>

                  {/* Phone */}
                  <button
                    onClick={() => setStep('phone')}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-amber-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-amber-950/10 dark:border-slate-800 rounded-2xl text-xs font-bold text-amber-950 dark:text-neutral-200 transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Use Phone Number</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </button>

                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-amber-950/5 dark:border-slate-800" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-[#FAF6EE] dark:bg-slate-900 px-3 text-muted-foreground/55">Or Explore First</span></div>
                </div>

                <button
                  onClick={handleContinueAsGuest}
                  className="w-full py-4 bg-amber-950/5 hover:bg-amber-950/10 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-amber-950/10 dark:border-slate-800/80 text-amber-950 dark:text-neutral-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Continue as Guest
                </button>
              </motion.div>
            )}

            {/* 3. GOOGLE SIGN IN SIMULATION */}
            {step === 'google' && (
              <motion.div
                key="google"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 my-auto"
              >
                <div className="text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-[#DE5246]/10 flex items-center justify-center font-black text-[#DE5246] text-sm mx-auto">G</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Google Login</h3>
                  <h4 className="text-base font-bold text-amber-950 dark:text-neutral-50">Choose a Google Account</h4>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {MOCK_GOOGLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar.email}
                      onClick={() => handleGoogleSelect(avatar)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 bg-white hover:bg-amber-50/40 dark:bg-slate-800 dark:hover:bg-slate-700 border border-amber-950/10 dark:border-slate-800 rounded-2xl text-[11px] text-left transition-all cursor-pointer"
                    >
                      <img src={avatar.avatar} alt={avatar.name} className="w-8 h-8 rounded-full border border-amber-950/10" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-amber-950 dark:text-neutral-200 truncate">{avatar.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{avatar.email}</p>
                      </div>
                      <span className="text-[8px] font-black uppercase bg-primary/10 text-primary px-2 py-1 rounded">Active</span>
                    </button>
                  ))}
                </div>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-amber-950/5 dark:border-slate-800" /></div>
                  <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-widest"><span className="bg-[#FAF6EE] dark:bg-slate-900 px-2 text-muted-foreground/45">Or use other email</span></div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter custom Google Name"
                    id="google_name_input"
                    className="w-full p-3 text-xs bg-white dark:bg-slate-800 rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="email"
                    placeholder="Enter custom Gmail"
                    id="google_email_input"
                    className="w-full p-3 text-xs bg-white dark:bg-slate-800 rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  
                  {errorText && <p className="text-[10px] text-rose-500 font-bold">{errorText}</p>}

                  <button
                    onClick={() => {
                      const nameInput = (document.getElementById('google_name_input') as HTMLInputElement)?.value;
                      const emailInput = (document.getElementById('google_email_input') as HTMLInputElement)?.value;
                      handleCustomGoogleSignIn(nameInput, emailInput);
                    }}
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-950 dark:bg-indigo-600 font-bold text-white text-xs rounded-xl uppercase tracking-wider cursor-pointer flex items-center justify-center"
                  >
                    {loading ? 'Connecting...' : 'Authorize and Sign In'}
                  </button>
                </div>

                <button
                  onClick={() => setStep('options')}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Back to options
                </button>
              </motion.div>
            )}

            {/* 4. APPLE SIGN IN SIMULATION */}
            {step === 'apple' && (
              <motion.div
                key="apple"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 my-auto"
              >
                <div className="text-center space-y-1">
                  <Apple className="w-10 h-10 text-black dark:text-white mx-auto" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Apple Secure</h3>
                  <h4 className="text-base font-bold text-amber-950 dark:text-neutral-50">Sign In with Apple ID</h4>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800/50 border border-amber-950/10 dark:border-slate-800 rounded-[1.5rem] space-y-4 shadow-inner">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Privacy Safeguarded</p>
                      <p className="text-[10px] text-muted-foreground">Apple hides your real email block automatically.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1 text-[10px] font-bold text-muted-foreground">
                      <span>Apple ID</span>
                    </div>
                    <input
                      type="text"
                      disabled
                      defaultValue="serene.subscriber@icloud.com"
                      className="w-full p-3 bg-amber-950/[0.03] dark:bg-slate-800 text-xs border border-amber-950/10 dark:border-slate-700/50 rounded-xl font-mono text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAppleVerify}
                    disabled={loading}
                    className="w-full py-3.5 bg-black text-white hover:brightness-110 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Share My Apple ID Securely
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setStep('options')}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. EMAIL CONTINUATION */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 my-auto"
              >
                <div className="text-center space-y-1">
                  <Mail className="w-8 h-8 text-amber-800 dark:text-indigo-400 mx-auto" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Email Access</h3>
                  <h4 className="text-base font-bold text-amber-950 dark:text-neutral-50">
                    {isLoginMode ? 'Sign In to Account' : 'Register with Email'}
                  </h4>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {!isLoginMode && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Your Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground/50" />
                        <input
                          type="text"
                          required
                          value={emailName}
                          onChange={(e) => setEmailName(e.target.value)}
                          placeholder="Elizabeth Bennett"
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 text-xs rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground/50" />
                      <input
                        type="email"
                        required
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="elizabeth@domain.com"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 text-xs rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Your Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground/50" />
                      <input
                        type="password"
                        required
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 text-xs rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {errorText && <p className="text-[10px] text-rose-500 font-bold">{errorText}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-950 dark:bg-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> {isLoginMode ? 'Access My Account' : 'Complete Setup'}
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setIsLoginMode(!isLoginMode);
                      setErrorText('');
                    }}
                    className="text-xs text-primary font-bold tracking-tight hover:underline cursor-pointer"
                  >
                    {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                  </button>
                  <div>
                    <button
                      onClick={() => setStep('options')}
                      className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer uppercase tracking-wider font-bold"
                    >
                      Back to options
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. PHONE NUMBER SUBMISSION */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 my-auto"
              >
                <div className="text-center space-y-1">
                  <Smartphone className="w-8 h-8 text-emerald-700 dark:text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Secure SMS</h3>
                  <h4 className="text-base font-bold text-amber-950 dark:text-neutral-50">Enter Mobile Number</h4>
                </div>

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mobile Phone</label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountry}
                        onChange={(e) => setPhoneCountry(e.target.value)}
                        className="p-3 bg-white dark:bg-slate-800 text-xs rounded-xl border border-amber-950/10 dark:border-slate-800 font-bold"
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(555) 000-1234"
                        className="flex-1 p-3 bg-white dark:bg-slate-800 text-xs rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary font-bold tracking-normal"
                      />
                    </div>
                  </div>

                  {errorText && <p className="text-[10px] text-rose-500 font-bold">{errorText}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-950 dark:bg-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? 'Requesting OTP...' : 'Get OTP Verification'}
                  </button>
                </form>

                <button
                  onClick={() => setStep('options')}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* 7. OTP VERIFICATION */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 my-auto"
              >
                <div className="text-center space-y-1">
                  <Key className="w-8 h-8 text-amber-700 dark:text-indigo-400 mx-auto" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Verify ID</h3>
                  <h4 className="text-base font-bold text-amber-950 dark:text-neutral-50">Enter Security Code</h4>
                  <p className="text-[10px] text-muted-foreground font-serif">We sent a mock verify SMS key. Please match or enter 123456.</p>
                </div>

                <div className="p-3 bg-amber-950/5 dark:bg-slate-850 border border-dotted border-amber-900/20 text-center rounded-xl">
                  <span className="text-[11px] uppercase font-black tracking-widest text-primary block">SIMULATED PHONE SMS</span>
                  <span className="text-base font-mono font-black text-amber-950 dark:text-indigo-400">{receivedOtp}</span>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={userOtpInput}
                      onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full p-4 bg-white dark:bg-slate-800 text-center text-lg font-mono font-black tracking-[0.6em] rounded-xl border border-amber-950/10 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {errorText && <p className="text-[10px] text-rose-500 font-bold">{errorText}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-950 dark:bg-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? 'Confirming Code...' : 'Activate & Sign In'}
                  </button>
                </form>

                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Change phone number
                </button>
              </motion.div>
            )}

            {/* 8. SUCCESS SCREEN */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 my-auto"
              >
                <div className="relative inline-flex mx-auto">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="inline-flex p-4 rounded-[1.8rem] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 relative">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Account Ready</h3>
                  <h4 className="text-xl font-bold text-amber-950 dark:text-neutral-50 px-2 leading-tight">
                    Welcome to Serene, {finalProfile?.displayName}!
                  </h4>
                </div>

                {/* Account Details Panel */}
                <div className="p-4 bg-white dark:bg-slate-850 border border-amber-950/10 dark:border-slate-800 rounded-3xl space-y-2.5 text-left text-xs max-w-xs mx-auto shadow-sm">
                  {finalProfile?.photoURL && (
                    <img src={finalProfile.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-amber-950/10 mx-auto mb-2" referrerPolicy="no-referrer" />
                  )}
                  <div className="flex justify-between border-b border-amber-950/5 pb-1 text-[11px]">
                    <span className="text-muted-foreground">ID Account</span>
                    <span className="font-mono text-amber-950 dark:text-neutral-200">#{(finalProfile?.email || 'serene').split('@')[0]}</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-950/5 pb-1 text-[11px]">
                    <span className="text-muted-foreground">Signed Provider</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[9px] tracking-wider">{finalProfile?.providerId}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Access Email</span>
                    <span className="font-serif text-amber-950 dark:text-neutral-300 truncate max-w-[140px]">{finalProfile?.email}</span>
                  </div>
                </div>

                <button
                  onClick={handleEnterApp}
                  className="w-full py-4 bg-amber-950 dark:bg-indigo-600 hover:brightness-110 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  Enter Serene Structure <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Small safe branding tag */}
        <div className="pt-4 text-center border-t border-amber-950/5 dark:border-slate-850 text-[9px] font-black uppercase tracking-widest text-muted-foreground/35 flex justify-center items-center gap-1">
          <Shield className="w-3 h-3" /> Secure Handshake Protocol
        </div>

      </div>
    </div>
  );
};
