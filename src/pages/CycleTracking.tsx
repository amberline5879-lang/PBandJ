import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Calendar as CalendarIcon, ChevronRight, Info, Heart, Sparkles, ChevronLeft, X, Smile, Frown, Meh, Activity as ActivityIcon, Moon, Brain, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfToday, isSameMonth } from 'date-fns';
import { cn } from '../lib/utils';

interface CycleEntry {
  id: string;
  uid: string;
  date: string;
  flow: 'none' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  mood: string;
  activities: string[];
  emotions: string[];
  notes: string;
}

const CycleTracking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Log Modal State
  const [flow, setFlow] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  useEffect(() => {
    const unsub = storage.subscribe(storage.key.CYCLE_ENTRIES, (data) => {
      const entryList = data as CycleEntry[];
      setEntries(entryList.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const existingEntry = entries.find(e => e.date === format(date, 'yyyy-MM-dd'));
    if (existingEntry) {
      setFlow(existingEntry.flow);
      setSelectedSymptoms(existingEntry.symptoms || []);
      setSelectedEmotions(existingEntry.emotions || []);
      setSelectedActivities(existingEntry.activities || []);
    } else {
      setFlow('none');
      setSelectedSymptoms([]);
      setSelectedEmotions([]);
      setSelectedActivities([]);
    }
    setShowLogModal(true);
  };

  const saveLog = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingEntry = entries.find(e => e.date === dateStr);

    const logData = {
      uid: user?.uid || 'guest',
      date: dateStr,
      flow,
      symptoms: selectedSymptoms,
      emotions: selectedEmotions,
      activities: selectedActivities,
      updatedAt: new Date().toISOString()
    };

    try {
      if (existingEntry) {
        await storage.update(storage.key.CYCLE_ENTRIES, existingEntry.id, logData);
      } else {
        await storage.add(storage.key.CYCLE_ENTRIES, logData);
      }
      setShowLogModal(false);
    } catch (error) {
      console.error('Error saving cycle log:', error);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEntryForDate = (date: Date) => entries.find(e => e.date === format(date, 'yyyy-MM-dd'));

  const phases = [
    { name: 'Menstrual', color: 'bg-[#FFD1DC]', text: 'text-[#D46A7E]', days: 'Days 1-5' },
    { name: 'Follicular', color: 'bg-[#E0F2F1]', text: 'text-[#00796B]', days: 'Days 6-14' },
    { name: 'Ovulatory', color: 'bg-[#FFF9C4]', text: 'text-[#FBC02D]', days: 'Days 14-16' },
    { name: 'Luteal', color: 'bg-[#E8EAF6]', text: 'text-[#3F51B5]', days: 'Days 17-28' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Droplets className="w-6 h-6" />
              <h1 className="text-3xl font-black tracking-tighter">Cycle Tracker</h1>
            </div>
            <p className="text-muted-foreground font-medium">Understand your body's natural rhythms.</p>
          </div>
        </div>
        <Link to="/health/cycle/info">
          <button className="p-3 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
            <Info className="w-5 h-5" />
          </button>
        </Link>
      </header>

      {/* Current Phase Visualization */}
      <section className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold tracking-tight">Current Phase</h2>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Day 12</span>
        </div>
        
        <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden flex">
          {phases.map((phase, i) => (
            <div key={i} className={cn("h-full", phase.color, i === 1 ? "w-[40%]" : "w-[20%]")} />
          ))}
          <motion.div 
            initial={{ left: 0 }}
            animate={{ left: '40%' }}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {phases.map((phase, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", phase.color)} />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{phase.name}</p>
                <p className="text-[10px] font-medium text-muted-foreground/60">{phase.days}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Card */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleDayClick(new Date())}
          className="p-6 rounded-[2rem] bg-[#FFD1DC] text-[#D46A7E] shadow-lg shadow-rose-200/50 flex flex-col items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95"
        >
          <Droplets className="w-8 h-8" />
          <span className="text-xs font-bold uppercase tracking-widest">Log Flow</span>
        </button>
        <Link to="/health/cycle/info" className="p-6 rounded-[2rem] bg-card border border-border flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all">
          <Sparkles className="w-8 h-8 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Cycle Info</span>
        </Link>
      </section>

      {/* Calendar View */}
      <section className="p-6 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold tracking-tight">Calendar</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-full transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-muted rounded-full transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground/40 py-2">{day}</div>
          ))}
          {/* Empty cells for start of month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day, i) => {
            const entry = getEntryForDate(day);
            const hasPeriod = entry && entry.flow !== 'none';
            const hasSymptoms = entry && (entry.symptoms?.length > 0 || entry.emotions?.length > 0);

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all",
                  isToday(day) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <span className={cn("text-xs font-bold", isToday(day) && "text-primary")}>{format(day, 'd')}</span>
                <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5">
                  {hasPeriod && <div className="h-0.5 w-full bg-rose-300 rounded-full" />}
                  {hasSymptoms && <div className="h-0.5 w-full bg-blue-300 rounded-full" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 px-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-rose-300 rounded-full" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-300 rounded-full" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Symptoms</span>
          </div>
        </div>
      </section>

      {/* Daily Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-lg bg-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-bottom border-border flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">Daily Log</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
                <button onClick={() => setShowLogModal(false)} className="p-2 hover:bg-muted rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Flow Selection */}
                <section className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Flow Intensity</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'light', 'medium', 'heavy'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFlow(f)}
                        className={cn(
                          "py-3 rounded-2xl border-2 transition-all text-[10px] font-bold uppercase tracking-widest",
                          flow === f ? "border-[#D46A7E] bg-[#FFD1DC] text-[#D46A7E]" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Symptoms */}
                <section className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Symptoms</label>
                  <div className="flex flex-wrap gap-2">
                    {['Cramps', 'Headache', 'Bloating', 'Acne', 'Backache', 'Tender Breasts', 'Nausea', 'Fatigue'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 transition-all text-[10px] font-bold uppercase tracking-widest",
                          selectedSymptoms.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Emotions */}
                <section className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Emotions</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'happy', icon: Smile, label: 'Happy' },
                      { id: 'calm', icon: Heart, label: 'Calm' },
                      { id: 'sad', icon: Frown, label: 'Sad' },
                      { id: 'anxious', icon: Brain, label: 'Anxious' },
                      { id: 'angry', icon: Zap, label: 'Angry' },
                      { id: 'tired', icon: Moon, label: 'Tired' },
                      { id: 'neutral', icon: Meh, label: 'Neutral' },
                      { id: 'energetic', icon: ActivityIcon, label: 'Energetic' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setSelectedEmotions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                          selectedEmotions.includes(id) ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Activities */}
                <section className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Activities</label>
                  <div className="flex flex-wrap gap-2">
                    {['Exercise', 'Meditation', 'Hydration', 'Socializing', 'Rest', 'Work', 'Hobbies', 'Outdoors'].map((a) => (
                      <button
                        key={a}
                        onClick={() => setSelectedActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 transition-all text-[10px] font-bold uppercase tracking-widest",
                          selectedActivities.includes(a) ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-border bg-muted/20">
                <button
                  onClick={saveLog}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                >
                  Save Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-8 rounded-[2.5rem] bg-secondary/30 border border-border/50 flex items-center gap-4">
        <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
          <Heart className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
          Tracking your cycle helps you understand energy shifts, mood patterns, and physical needs.
        </p>
      </footer>
    </div>
  );
};

export default CycleTracking;
