import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  Home, List, Calendar, Book, Settings, Timer, User, Sparkles, Heart,
  Sun, Smile, Wind, Target, Palette, Users, Zap, Meh, Moon, Cloud, 
  AlertCircle, Waves, Flame, Thermometer, Briefcase, Bed, Utensils, 
  Activity, CloudSun, DollarSign, Coffee, Star, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { storage } from '../lib/storage';

const moodIcons: Record<string, React.FC<any>> = {
  radiant: Sun,
  joyful: Smile,
  calm: Wind,
  focused: Target,
  creative: Palette,
  social: Users,
  energized: Zap,
  content: Meh,
  tired: Moon,
  low: Cloud,
  anxious: AlertCircle,
  stressed: Waves,
  frustrated: Flame,
  recovering: Thermometer,
  reflective: Book
};

const factorIcons: Record<string, React.FC<any>> = {
  work: Briefcase,
  relationships: Heart,
  sleep: Bed,
  food: Utensils,
  health: Activity,
  weather: CloudSun,
  finances: DollarSign,
  hobby: Palette,
  social: Users,
  home: Home,
  personal: Star,
  routine: Coffee
};

const LOCAL_MOODS = [
  { id: 'radiant', label: 'Radiant', color: 'bg-[#FFFCDF] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#FFEBE2] text-[#4A3728] border-[#95714F]' },
  { id: 'joyful', label: 'Joyful', color: 'bg-[#FFEBE2] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#FFE0DE] text-[#4A3728] border-[#95714F]' },
  { id: 'calm', label: 'Calm', color: 'bg-[#EDFDE0] text-[#8C916C] border-[#ACB087]', activeColor: 'bg-[#ACB087] text-white border-[#8C916C]' },
  { id: 'focused', label: 'Focused', color: 'bg-[#DEFEF9] text-[#4A3728] border-[#C7AF94]', activeColor: 'bg-[#95714F] text-white border-[#95714F]' },
  { id: 'creative', label: 'Creative', color: 'bg-[#EFE0FD] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
  { id: 'social', label: 'Social', color: 'bg-[#FFEBE2] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#8C916C] text-white border-[#8C916C]' },
  { id: 'energized', label: 'Energized', color: 'bg-[#FFFCDF] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#8C916C] text-white border-[#8C916C]' },
  { id: 'content', label: 'Content', color: 'bg-[#EDFDE0] text-[#4A3728] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
  { id: 'tired', label: 'Tired', color: 'bg-[#EFE0FD] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#4A3728] text-white border-[#4A3728]' },
  { id: 'low', label: 'Low', color: 'bg-[#DEFEF9] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#95714F] text-white border-[#95714F]' },
  { id: 'anxious', label: 'Anxious', color: 'bg-[#FFE0DE] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
  { id: 'stressed', label: 'Stressed', color: 'bg-[#DEFEF9] text-[#8C916C] border-[#ACB087]', activeColor: 'bg-[#ACB087] text-white border-[#ACB087]' },
  { id: 'frustrated', label: 'Frustrated', color: 'bg-[#FFE0DE] text-[#95714F] border-[#C7AF94]', activeColor: 'bg-[#95714F] text-white border-[#95714F]' },
  { id: 'recovering', label: 'Recovering', color: 'bg-[#EDFDE0] text-[#8C916C] border-[#ACB087]', activeColor: 'bg-[#8C916C] text-white border-[#8C916C]' },
  { id: 'reflective', label: 'Reflective', color: 'bg-[#EFE0FD] text-[#4A3728] border-[#C7AF94]', activeColor: 'bg-[#C7AF94] text-white border-[#C7AF94]' },
];

const LOCAL_FACTORS = [
  { id: 'work', label: 'Work' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'food', label: 'Food' },
  { id: 'health', label: 'Health' },
  { id: 'weather', label: 'Weather' },
  { id: 'finances', label: 'Finances' },
  { id: 'hobby', label: 'Hobby' },
  { id: 'social', label: 'Social' },
  { id: 'home', label: 'Home' },
  { id: 'personal', label: 'Personal' },
  { id: 'routine', label: 'Routine' },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Mood pop-up state
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(true);

  const todayStr = new Date().toDateString();

  useEffect(() => {
    const unsub = storage.subscribe(storage.key.MOOD_ENTRIES, (data) => {
      setMoodEntries(data || []);
    }, user?.uid);
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    const isDismissed = localStorage.getItem('serene_last_mood_prompt_resolved') === todayStr;
    setPromptDismissed(isDismissed);
  }, [todayStr]);

  const alreadyTrackedToday = moodEntries.some(e => {
    try {
      return new Date(e.date).toDateString() === todayStr;
    } catch {
      return false;
    }
  });

  const showMoodPopup = !alreadyTrackedToday && !promptDismissed;

  const handleClose = () => {
    localStorage.setItem('serene_last_mood_prompt_resolved', todayStr);
    setPromptDismissed(true);
  };

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

  const handleSaveMood = async () => {
    if (selectedMoods.length === 0) return;
    setIsSubmitting(true);
    
    const primaryMood = selectedMoods[0];
    const moodEntry = {
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
        const moodLabels = selectedMoods.map(id => LOCAL_MOODS.find(m => m.id === id)?.label).filter(Boolean);
        const journalContent = `Mood Check-in: ${moodLabels.join(', ')} (${intensity}/10)\nEnergy Level: ${energy}/10\nFactors: ${selectedFactors.join(', ')}\n\n${note}`;
        
        await storage.add(storage.key.JOURNAL_ENTRIES, {
          uid: user?.uid || 'guest',
          type: 'dump',
          content: journalContent,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.setItem('serene_last_mood_prompt_resolved', todayStr);
      setPromptDismissed(true);
      
      // Reset
      setSelectedMoods([]);
      setIntensity(5);
      setEnergy(5);
      setSelectedFactors([]);
      setNote('');
    } catch (error) {
      console.error('Error saving daily mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems = [
    { icon: List, label: 'Lists', path: '/lists' },
    { icon: Sparkles, label: 'Coach', path: '/ai-coach' },
    { icon: Heart, label: 'Health', path: '/health' },
    { icon: Home, label: 'Today', path: '/' },
    { icon: Calendar, label: 'Plan', path: '/plan' },
    { icon: Book, label: 'Journal', path: '/journal' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  console.log("Layout rendering, path:", location.pathname);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background text-foreground relative pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-[100] bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-border">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-primary"></h1>
        </div>
        <div className="flex gap-3">
          <Link to="/routines" className="p-2 rounded-full hover:bg-muted transition-colors">
            <Timer className="w-5 h-5 text-primary" />
          </Link>
          <Link to="/settings" className="p-1 rounded-full hover:bg-muted transition-colors overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="text-[8px] text-muted-foreground/10 absolute top-0 left-0">Path: {location.pathname}</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/90 backdrop-blur-lg border-t border-border px-4 pt-3 pb-7 flex justify-around items-center z-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 relative",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* "You're doing enough" floating message - subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.4 }}
        className="text-center py-12 text-sm italic text-muted-foreground pointer-events-none"
      >
        You're doing enough.
      </motion.div>

      {/* Daily Mood Check-In Pop-up */}
      <AnimatePresence>
        {showMoodPopup && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card border border-border w-full max-w-sm rounded-[2rem] p-5 shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pb-3 border-b border-border mb-4">
                <div className="inline-flex p-2 rounded-full bg-primary/10 text-primary mb-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-[#B3A183]">Daily Mind Reset</h2>
                <h3 className="text-xs font-bold text-muted-foreground mt-0.5">How are you feeling today?</h3>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-none pb-4">
                
                {/* Mood Selection Row */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Moods (Tap multiple)</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LOCAL_MOODS.map((mood) => {
                      const isActive = selectedMoods.includes(mood.id);
                      const Icon = moodIcons[mood.id] || Smile;
                      return (
                        <button
                          key={mood.id}
                          onClick={() => toggleMood(mood.id)}
                          className={cn(
                            "py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all",
                            isActive ? mood.activeColor : `${mood.color} border-border/40 hover:scale-[1.02]`
                          )}
                        >
                          <Icon className="w-4 h-4 mb-0.5" />
                          <span className="truncate max-w-full">{mood.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intensity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Intensity</h4>
                    <span className="text-base font-black text-primary">{intensity}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Energy Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Energy</h4>
                    <span className="text-base font-black text-primary">{energy}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Influencing Factors */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Influencing factors</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {LOCAL_FACTORS.map((factor) => {
                      const isSelected = selectedFactors.includes(factor.id);
                      const Icon = factorIcons[factor.id] || Heart;
                      return (
                        <button
                          key={factor.id}
                          onClick={() => toggleFactor(factor.id)}
                          className={cn(
                            "py-1.5 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all flex items-center gap-1",
                            isSelected
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-secondary text-muted-foreground border-border/40 hover:bg-secondary/80"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {factor.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Note */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Thoughts (Optional)</h4>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write a brief reflection..."
                    rows={2}
                    className="w-full p-3 rounded-xl bg-[#F2EDE2]/30 dark:bg-slate-950/20 border border-border/40 text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/35 resize-none leading-relaxed"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex flex-col gap-2 mt-2">
                <button
                  onClick={handleSaveMood}
                  disabled={selectedMoods.length === 0 || isSubmitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-40 transition-all flex items-center justify-center gap-1 shadow-md hover:opacity-95"
                >
                  {isSubmitting ? 'Saving...' : 'Save Check-in'}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 bg-transparent text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Maybe Later
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
