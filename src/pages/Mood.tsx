import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Frown, Meh, Smile, Sparkles, Moon, Flame, 
  CloudRain, Ghost, UserX, AlertCircle, Circle, Briefcase, 
  GraduationCap, Heart, Users, Palette, Activity, Utensils, 
  Plus, Save, Image as ImageIcon, Calendar, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { MoodEntry, JournalEntry } from '../types';
import { useAuth } from '../components/AuthProvider';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';

const moods = [
  { id: 'awful', label: 'Awful', icon: Frown, color: 'text-destructive', bg: 'bg-destructive/10' },
  { id: 'sad', label: 'Sad', icon: CloudRain, color: 'text-sky', bg: 'bg-sky/10' },
  { id: 'irritated', label: 'Irritated', icon: Flame, color: 'text-rose', bg: 'bg-rose/10' },
  { id: 'tired', label: 'Tired', icon: Moon, color: 'text-slate-500', bg: 'bg-slate-100' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-muted-foreground', bg: 'bg-muted' },
  { id: 'bored', label: 'Bored', icon: Ghost, color: 'text-zinc-400', bg: 'bg-zinc-100' },
  { id: 'lonely', label: 'Lonely', icon: UserX, color: 'text-indigo-400', bg: 'bg-indigo-100' },
  { id: 'nervous', label: 'Nervous', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'numb', label: 'Numb', icon: Circle, color: 'text-zinc-300', bg: 'bg-zinc-50' },
  { id: 'happy', label: 'Happy', icon: Smile, color: 'text-moss', bg: 'bg-moss/10' },
  { id: 'radiant', label: 'Radiant', icon: Sparkles, color: 'text-lavender', bg: 'bg-lavender/10' },
];

const factors = [
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'school', label: 'School', icon: GraduationCap },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'hobbies', label: 'Hobbies', icon: Palette },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'other', label: 'Other', icon: Plus },
];

const Mood: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<number>(70);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);

  useEffect(() => {
    const unsub = storage.subscribe(storage.key.MOODS || 'moods', (data) => {
      setHistory(data as MoodEntry[]);
    });
    return () => unsub();
  }, []);

  const toggleFactor = (fId: string) => {
    setSelectedFactors(prev => 
      prev.includes(fId) ? prev.filter(i => i !== fId) : [...prev, fId]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) return;
    setSaving(true);
    try {
      const entry: Partial<MoodEntry> = {
        uid: user?.uid || 'guest',
        mood: selectedMood,
        factors: selectedFactors,
        intensity,
        note,
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: new Date().toISOString()
      };

      await storage.add(storage.key.MOODS || 'moods', entry);

      // Optionally also add to journal if there's a note
      if (note) {
        const journalEntry: Partial<JournalEntry> = {
          uid: user?.uid || 'guest',
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'dump',
          content: `Mood check-in: ${moods.find(m => m.id === selectedMood)?.label}\nIntensity: ${intensity}%\nFactors: ${selectedFactors.join(', ')}\n\n${note}`
        };
        await storage.add(storage.key.JOURNAL_ENTRIES, journalEntry);
      }

      // Reset form
      setSelectedMood('');
      setSelectedFactors([]);
      setIntensity(70);
      setNote('');
      
      alert('Reflection saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getMoodIcon = (moodId: string) => {
    const m = moods.find(m => m.id === moodId);
    if (!m) return null;
    const Icon = m.icon;
    return <Icon className={cn("w-4 h-4", m.color)} />;
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-primary font-serif">Daily Reflection</h1>
        <div className="w-10"></div>
      </header>

      {/* Mood Palette Selection */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">How are you feeling?</h2>
          <p className="text-sm text-muted-foreground italic">Take a moment to check in with yourself.</p>
        </div>

        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6 pb-4">
          <div className="flex gap-4 min-w-max">
            {moods.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className="flex flex-col items-center gap-3 group transition-all"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                    isSelected ? cn(m.bg, "ring-4 ring-primary/20 scale-110") : "bg-card hover:bg-muted"
                  )}>
                    <Icon className={cn("w-8 h-8", isSelected ? m.color : "text-muted-foreground")} />
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider transition-colors",
                    isSelected ? m.color : "text-muted-foreground/60"
                  )}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Factors Selection */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight">What's making you feel this way?</h2>
        <div className="flex flex-wrap gap-3">
          {factors.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFactors.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleFactor(f.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Intensity Slider */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Mood intensity</h2>
          <span className="text-4xl font-bold text-primary font-serif">{intensity}</span>
        </div>
        <div className="relative pt-6">
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="mood-range w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Not good</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amazing</span>
          </div>
        </div>
      </section>

      {/* Quick Journal Entry */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Quick Journal Entry</h2>
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write more..."
            className="w-full min-h-[160px] p-6 rounded-[2rem] bg-card border border-border text-sm focus:outline-none focus:border-primary transition-all resize-none shadow-sm"
          />
          <button className="absolute bottom-4 right-4 p-3 rounded-full bg-background border border-border text-primary hover:bg-muted transition-colors">
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Action Button */}
      <section>
        <button
          onClick={handleSave}
          disabled={!selectedMood || saving}
          className="w-full py-5 rounded-[2rem] bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[0.99] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Reflection'}
        </button>
      </section>

      {/* Monthly Overview Section */}
      <section className="space-y-6 pt-8 border-t border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Monthly Overview</h2>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">{format(today, 'MMMM yyyy')}</span>
        </div>

        <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
          <div className="grid grid-cols-7 gap-y-6 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={`${d}-${i}`} className="text-[10px] font-black text-muted-foreground/40">{d}</span>
            ))}
            
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-8" />
            ))}

            {daysInMonth.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const entries = history.filter(h => h.date === dayStr);
              const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 min-h-[40px]">
                  <span className={cn(
                    "text-[10px] font-bold",
                    isSameDay(day, today) ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {latestEntry ? (
                    getMoodIcon(latestEntry.mood)
                  ) : (
                    <div className="w-1.5 h-1.5 bg-muted-foreground/20 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        .mood-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border: 4px solid var(--primary);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default Mood;
