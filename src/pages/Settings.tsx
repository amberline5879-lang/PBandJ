import React from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../components/AuthProvider';
import { ThemeType, FontSizeType, FontType, ScheduleIntervalType } from '../types';
import { Palette, Type, Layout, Shield, LogOut, Info, ChevronRight, Clock, Calendar as CalendarIcon, CheckCircle2, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useTheme();
  const { user, accessToken, googleSignIn, signOut, loading: authLoading } = useAuth();

  const themes: { id: ThemeType; label: string; color: string }[] = [
    { id: 'beige', label: 'Beige', color: 'bg-[#F4EBE2]' },
    { id: 'orange', label: 'Orange', color: 'bg-[#F97316]' },
    { id: 'green', label: 'Green', color: 'bg-[#418252]' },
    { id: 'blue', label: 'Blue', color: 'bg-[#3AA4E2]' },
    { id: 'pink', label: 'Pink', color: 'bg-[#F9A4C0]' },
    { id: 'dark', label: 'Dark', color: 'bg-[#121212]' },
  ];

  const fontSizes: { id: FontSizeType; label: string }[] = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Appearance Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSettings({ theme: theme.id })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300",
                    settings.theme === theme.id 
                      ? "border-primary bg-primary/10 text-primary scale-105 shadow-lg ring-2 ring-primary/20" 
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full shadow-sm border-2 border-white/20", theme.color)} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-tighter", settings.theme === theme.id ? "text-primary" : "text-muted-foreground")}>{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Font Size</label>
            <div className="flex gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => updateSettings({ fontSize: size.id })}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 transition-all duration-300 text-xs font-bold uppercase tracking-widest",
                    settings.fontSize === size.id ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Schedule</h2>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Time Interval</label>
          <div className="grid grid-cols-3 gap-2">
            {[60, 30, 15, 10, 5].map((interval) => (
              <button
                key={interval}
                onClick={() => updateSettings({ scheduleInterval: interval as ScheduleIntervalType })}
                className={cn(
                  "py-3 rounded-xl border-2 transition-all duration-300 text-xs font-bold uppercase tracking-widest",
                  settings.scheduleInterval === interval ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {interval === 60 ? '1 Hour' : `${interval} Min`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Features</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Cycle Tracking</h3>
            <p className="text-[10px] text-muted-foreground">Show cycle tracking in Health section</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex w-full justify-between px-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              <span>Off</span>
              <span>On</span>
            </div>
            <button
              onClick={() => updateSettings({ showCycleTracking: !settings.showCycleTracking })}
              className={cn(
                "w-12 h-6 rounded-full transition-all duration-300 relative",
                settings.showCycleTracking ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                settings.showCycleTracking ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold tracking-tight">Integrations</h2>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Google Calendar</h3>
                {accessToken ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sync daily schedules, view calendar events in the Plan tab, and create events directly in Google Calendar.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">
              {accessToken ? 'OAuth token active for calendar scopes' : 'Google Authentication required'}
            </span>
            <button
              onClick={() => googleSignIn()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" /> {accessToken ? 'Re-sync Account' : 'Connect Calendar'}
            </button>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Account Avatar" 
                className="w-12 h-12 rounded-full border border-border object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase">
                {user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate text-foreground">
                {user?.displayName || 'Guest User'}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || 'guest@local.app'}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[8px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded tracking-wider">
                  {user?.providerId === 'guest' ? 'Guest Mode' : `Sync: ${user?.providerId || 'password'}`}
                </span>
                {user?.isAnonymous === false && (
                  <span className="text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded tracking-wider">
                    Cloud Secured
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-2 space-y-1">
            <button className="w-full flex items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span>About Serene Structure</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            
            <button
              onClick={() => signOut()}
              disabled={authLoading}
              className="w-full flex items-center justify-between py-2 text-rose-600 dark:text-rose-400 font-bold text-xs"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>{authLoading ? 'Signing Out...' : 'Sign Out of Account'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
