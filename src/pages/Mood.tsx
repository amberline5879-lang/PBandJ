import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Smile, Wind, Target, Palette, Users, Zap, Meh, 
  Moon, Cloud, AlertCircle, Waves, Flame, Thermometer, Book,
  Heart, Briefcase, Bed, Utensils, Activity, CloudSun, DollarSign,
  Coffee, Home, Star, Send, ChevronLeft, ChevronRight, History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { MoodEntry, JournalEntry } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

const MOODS = [
  { id: 'radiant', label: 'Radiant', icon: Sun, color: 'bg-[#FFFCDF] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#FFEBE2] text-[#4A3728] border-[#95714F]' },
  { id: 'joyful', label: 'Joyful', icon: Smile, color: 'bg-[#FFEBE2] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#FFE0DE] text-[#4A3728] border-[#95714F]' },
  { id: 'calm', label: 'Calm', icon: Wind, color: 'bg-[#EDFDE0] text-[#8C916C] border-[#ACB087]', activeColor: 'bg-[#ACB087] text-white border-[#8C916C]' },
  { id: 'focused', label: 'Focused', icon: Target, color: 'bg-[#DEFEF9] text-[#4A3728] border-[#C7AF94]', activeColor: 'bg-[#95714F] text-white border-[#95714F]' },
  { id: 'creative', label: 'Creative', icon: Palette, color: 'bg-[#EFE0FD] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
  { id: 'social', label: 'Social', icon: Users, color: 'bg-[#FFEBE2] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#8C916C] text-white border-[#8C916C]' },
  { id: 'energized', label: 'Energized', icon: Zap, color: 'bg-[#FFFCDF] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#8C916C] text-white border-[#8C916C]' },
  { id: 'content', label: 'Content', icon: Meh, color: 'bg-[#EDFDE0] text-[#4A3728] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
  { id: 'tired', label: 'Tired', icon: Moon, color: 'bg-[#EFE0FD] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#4A3728] text-white border-[#4A3728]' },
  { id: 'low', label: 'Low', icon: Cloud, color: 'bg-[#DEFEF9] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#95714F] text-white border-[#95714F]' },
  { id: 'anxious', label: 'Anxious', icon: AlertCircle, color: 'bg-[#FFE0DE] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
  { id: 'stressed', label: 'Stressed', icon: Waves, color: 'bg-[#DEFEF9] text-[#8C916C] border-[#ACB087]', activeColor: 'bg-[#ACB087] text-white border-[#ACB087]' },
  { id: 'frustrated', label: 'Frustrated', icon: Flame, color: 'bg-[#FFE0DE] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#95714F] text-white border-[#95714F]' },
  { id: 'recovering', label: 'Recovering', icon: Thermometer, color: 'bg-[#EDFDE0] text-[#8C916C] border-[#ACB087]', activeColor: 'bg-[#8C916C] text-white border-[#8C916C]' },
  { id: 'reflective', label: 'Reflective', icon: Book, color: 'bg-[#EFE0FD] text-[#4A3728] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
];

const FACTORS = [
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'sleep', label: 'Sleep', icon: Bed },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'weather', label: 'Weather', icon: CloudSun },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'hobby', label: 'Hobby', icon: Palette },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'personal', label: 'Personal', icon: Star },
  { id: 'routine', label: 'Routine', icon: Coffee },
];

const Mood: React.FC = () => {
  const { user } = useAuth();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubMood = storage.subscribe(storage.key.MOOD_ENTRIES, (data) => {
      setEntries(data as MoodEntry[]);
    });
    return () => unsubMood();
  }, []);

  const toggleMood = (moodId: string) => {
    setSelectedMoods(prev =>
      prev.includes(moodId)
        ? prev.filter(id => id !== moodId)
        : [...prev, moodId]
    );
  };

  const toggleFactor = (factorId: string) => {
    setSelectedFactors(prev => 
      prev.includes(factorId) 
        ? prev.filter(id => id !== factorId) 
        : [...prev, factorId]
    );
  };

  const handleSave = async () => {
    if (selectedMoods.length === 0) return;
    setIsSubmitting(true);
    
    const primaryMood = selectedMoods[0];
    const moodEntry: Omit<MoodEntry, 'id'> = {
      uid: user?.uid || 'guest',
      date: new Date().toISOString(),
      moodId: primaryMood,
      moodIds: selectedMoods,
      intensity,
      factors: selectedFactors,
      note,
      createdAt: new Date().toISOString(),
      energy,
    };

    try {
      await storage.add(storage.key.MOOD_ENTRIES, moodEntry);
      
      // Also save to journal if there's a note
      if (note.trim()) {
        const moodLabels = selectedMoods.map(id => MOODS.find(m => m.id === id)?.label).filter(Boolean);
        const journalContent = `Moods: ${moodLabels.join(', ')} (${intensity}/10)\nEnergy Level: ${energy}/10\nFactors: ${selectedFactors.join(', ')}\n\n${note}`;
        
        await storage.add(storage.key.JOURNAL_ENTRIES, {
          uid: user?.uid || 'guest',
          type: 'dump',
          content: journalContent,
          createdAt: new Date().toISOString(),
        } as Omit<JournalEntry, 'id'>);
      }

      // Reset form
      setSelectedMoods([]);
      setIntensity(5);
      setEnergy(5);
      setSelectedFactors([]);
      setNote('');
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter">Mood & Energy</h1>
        <p className="text-muted-foreground font-medium">How are you feeling in this moment?</p>
      </header>

      {/* Mood Palette */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Mood Palette (Select multiple)</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            const isActive = selectedMoods.includes(mood.id);
            return (
              <motion.button
                key={mood.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMood(mood.id)}
                className={cn(
                  "p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 group",
                  isActive ? mood.activeColor : mood.color,
                  !isActive && "hover:border-primary/50"
                )}
              >
                <Icon className={cn("w-6 h-6 mb-1", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{mood.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Intensity Slider */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intensity</h2>
          <span className="text-6xl font-black tracking-tighter text-primary">{intensity}</span>
        </div>
        <div className="relative pt-6">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 px-1">
            <span>Minimal</span>
            <span>Intense</span>
          </div>
        </div>
      </section>

      {/* Energy Slider */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Energy Level</h2>
            <p className="text-xs text-muted-foreground mt-1">How energetic or fatigued do you feel?</p>
          </div>
          <span className="text-6xl font-black tracking-tighter text-primary">{energy}</span>
        </div>
        <div className="relative pt-6">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 px-1">
            <span>Fatigued</span>
            <span>Hyper-energized</span>
          </div>
        </div>
      </section>

      {/* Factor Tracking */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">What's influencing this?</h2>
        <div className="flex flex-wrap gap-2">
          {FACTORS.map((factor) => {
            const Icon = factor.icon;
            const isActive = selectedFactors.includes(factor.id);
            return (
              <button
                key={factor.id}
                onClick={() => toggleFactor(factor.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-card border-border hover:border-primary/30"
                )}
              >
                <Icon className="w-3 h-3" />
                {factor.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Journal Entry */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Reflection</h2>
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write down any details... (Will be saved to your journal)"
            className="w-full min-h-[120px] p-6 rounded-[2rem] bg-card border-2 border-border text-sm focus:outline-none focus:border-primary transition-all resize-none shadow-sm"
          />
          <button
            onClick={handleSave}
            disabled={selectedMoods.length === 0 || isSubmitting}
            className={cn(
              "absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg",
              selectedMoods.length === 0 || isSubmitting 
                ? "bg-muted text-muted-foreground cursor-not-allowed" 
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
            )}
          >
            {isSubmitting ? "Saving..." : (
              <>
                Save Check-in
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </section>

      {/* Monthly Overview */}
      <section className="space-y-8 p-8 rounded-[2.5rem] bg-secondary/20 border-2 border-dashed border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black tracking-tighter">Patterns</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-black uppercase tracking-widest">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-[10px] font-black text-muted-foreground pb-4">{day}</div>
          ))}
          {days.map((day, idx) => {
            const dayEntries = entries.filter(e => isSameDay(new Date(e.date), day));
            const isCurrentMonth = isSameDay(startOfMonth(day), startOfMonth(currentMonth));
            
            return (
              <div 
                key={idx} 
                className={cn(
                  "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1.5 relative group cursor-default p-1",
                  isCurrentMonth ? "bg-white/50 border-border/50" : "opacity-20 pointer-events-none"
                )}
              >
                <span className="text-[10px] font-black text-muted-foreground/60">{format(day, 'd')}</span>
                <div className="flex flex-wrap justify-center gap-0.5">
                  {dayEntries.slice(0, 4).map((entry, eIdx) => {
                    const mood = MOODS.find(m => m.id === entry.moodId);
                    return (
                      <div 
                        key={eIdx}
                        className={cn("w-2 h-2 rounded-full", mood?.activeColor.split(' ')[0] || 'bg-primary')} 
                        title={`${mood?.label} (${entry.intensity}/10)`}
                      />
                    );
                  })}
                  {dayEntries.length > 4 && <div className="w-2 h-2 rounded-full bg-muted border border-border" />}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Mood;
