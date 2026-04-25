import React from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../components/AuthProvider';
import { ThemeType, FontSizeType, FontType, ScheduleIntervalType } from '../types';
import { Palette, Type, Layout, Shield, LogOut, Info, ChevronRight, Clock, Database, Download, Upload, Trash2 } from 'lucide-react';
import { storage } from '../lib/storage';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useTheme();
  const { signOut } = useAuth();

  const handleExport = async () => {
    try {
      const data = await storage.exportAll();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serene_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await storage.importAll(content);
        alert('Data imported successfully! The app will refresh.');
        window.location.reload();
      } catch (error) {
        alert('Failed to import data: ' + (error instanceof Error ? error.message : 'Invalid file'));
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = async () => {
    if (confirm('WARNING: This will permanently delete ALL your data (tasks, meals, journal, everything). This cannot be undone. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const themes: { id: ThemeType; label: string; color: string }[] = [
    { id: 'pastel', label: 'Pastel', color: 'bg-[#F4EBE2]' },
    { id: 'vibrant', label: 'Vibrant', color: 'bg-[#FFCC99]' },
    { id: 'green', label: 'Green', color: 'bg-[#81b29a]' },
    { id: 'blue', label: 'Blue', color: 'bg-[#457b9d]' },
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

      {/* Account Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        </div>

        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-all text-sm font-medium">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <span>About Serene Structure</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Data Management</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-lg transition-all"
          >
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest">Backup</p>
              <p className="text-[10px] text-muted-foreground">Download all data</p>
            </div>
          </button>

          <label className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-card border border-border shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <div className="p-3 rounded-full bg-secondary/20 text-secondary-foreground">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest">Restore</p>
              <p className="text-[10px] text-muted-foreground">Import from backup</p>
            </div>
          </label>

          <button 
            onClick={clearAllData}
            className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-card border border-border shadow-sm hover:bg-destructive/5 hover:border-destructive/30 transition-all"
          >
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest">Reset</p>
              <p className="text-[10px] text-muted-foreground">Wipe all data</p>
            </div>
          </button>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
