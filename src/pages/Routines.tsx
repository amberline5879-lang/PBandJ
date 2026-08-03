import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, CheckCircle2, Circle, Plus, ChevronRight, X, SkipForward, SkipBack, Pause, RotateCcw, Clock, Trash2, Check, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { Routine, RoutineStep } from '../types';
import confetti from 'canvas-confetti';

const DING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const Routines: React.FC = () => {
  const { user, accessToken, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [steps, setSteps] = useState<RoutineStep[]>([]);

  // Google Calendar Routine Sync States
  const [syncRoutine, setSyncRoutine] = useState<Routine | null>(null);
  const [syncTime, setSyncTime] = useState('09:00');
  const [syncDate, setSyncDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSyncingToGCal, setIsSyncingToGCal] = useState(false);

  const handleSyncToGoogleCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncRoutine || !accessToken) return;

    setIsSyncingToGCal(true);
    try {
      const [startH, startM] = syncTime.split(':').map(Number);
      const start = new Date(syncDate);
      start.setHours(startH, startM, 0, 0);

      // Sum step durations (in seconds)
      const totalSeconds = syncRoutine.steps?.reduce((acc, step) => acc + (step.duration || 0), 0) || 0;
      const totalMinutes = Math.max(15, Math.ceil(totalSeconds / 60));

      const end = new Date(start.getTime() + totalMinutes * 60000);

      const stepDetails = syncRoutine.steps
        ?.map((step, i) => `${i + 1}. ${step.title} (${Math.round((step.duration || 0) / 60)} min)`)
        .join('\n') || '';

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `Routine: ${syncRoutine.name}`,
          description: `Total duration: ${totalMinutes}m\n\nQueued Steps:\n${stepDetails}\n\nSynced via Serene Structure`,
          start: {
            dateTime: start.toISOString()
          },
          end: {
            dateTime: end.toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Google Calendar rejected the event creation');
      }

      alert(`Successfully scheduled "${syncRoutine.name}" on Google Calendar!`);
      setSyncRoutine(null);
    } catch (err: any) {
      console.error('Failed to sync routine to GCal:', err);
      alert('Event creation failed. Please check permissions.');
    } finally {
      setIsSyncingToGCal(false);
    }
  };

  useEffect(() => {
    const unsub = storage.subscribe(storage.key.ROUTINES, (data) => {
      const docs = data as Routine[];
      // Sort in memory to avoid index issues
      docs.sort((a, b) => (a.order || 0) - (b.order || 0));
      setRoutines(docs);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let interval: any;
    if (!isPaused && timeLeft > 0 && activeRoutine && activeStepId) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isPaused && activeRoutine && activeStepId) {
      const currentIndex = steps.findIndex(s => s.id === activeStepId);
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        setActiveStepId(nextStep.id);
        setTimeLeft(nextStep.duration || 0);
      } else {
        setActiveRoutine(null);
        setActiveStepId(null);
      }
    }
    return () => clearInterval(interval);
  }, [isPaused, timeLeft, activeRoutine, activeStepId, steps]);

  const startRoutine = (routine: Routine) => {
    if (!routine.steps || routine.steps.length === 0) return;
    const initialSteps = routine.steps.map(s => ({ ...s, completed: false }));
    setActiveRoutine(routine);
    setSteps(initialSteps);
    setActiveStepId(initialSteps[0].id);
    setTimeLeft(initialSteps[0].duration || 0);
    setIsPaused(false);
  };

  const closeRoutine = () => {
    setActiveRoutine(null);
    setActiveStepId(null);
  };

  const deleteRoutine = async (id: string) => {
    try {
      await storage.delete(storage.key.ROUTINES, id);
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playDing = () => {
    const audio = new Audio(DING_SOUND_URL);
    audio.play().catch(e => console.log('Audio play blocked:', e));
  };

  const triggerCelebration = () => {
    playDing();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8C916C', '#C89B9B', '#A8B5A8', '#D1B3C4', '#D9C5B2']
    });
  };

  const toggleStep = (id: string, index: number) => {
    const newSteps = [...steps];
    const idx = newSteps.findIndex(s => s.id === id);
    if (idx === -1) return;

    const wasCompleted = newSteps[idx].completed;
    newSteps[idx].completed = !wasCompleted;
    setSteps(newSteps);
    
    // If we just completed a step
    if (!wasCompleted) {
      triggerCelebration();
      
      // If we completed the current active step, move to next
      if (id === activeStepId) {
        if (idx < steps.length - 1) {
          const nextStep = steps[idx + 1];
          setActiveStepId(nextStep.id);
          setTimeLeft(nextStep.duration || 0);
        } else {
          // Routine complete!
          setTimeout(() => {
            triggerCelebration(); // Double celebration for finishing
            alert("Routine Complete! Amazing job!");
          }, 500);
        }
      }
    }
  };

  const currentStep = steps.find(s => s.id === activeStepId) || steps[0];
  const currentStepIndex = steps.findIndex(s => s.id === activeStepId);

  // Remove dangerous null return that might cause blank page if activeRoutine is set but currentStep is null
  // if (activeRoutine && !currentStep) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Your Routines</h2>
        <Link 
          to="/create-routine"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          New
        </Link>
      </div>

      <div className="grid gap-4">
        {routines.map((routine, idx) => (
          <motion.div
            key={routine.id}
            whileHover={{ y: -2 }}
            className={cn(
              "group p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300",
              idx % 4 === 0 ? "bg-moss/20 border-moss/30" : idx % 4 === 1 ? "bg-rose/20 border-rose/30" : idx % 4 === 2 ? "bg-sky/20 border-sky/30" : "bg-lavender/20 border-lavender/30"
            )}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  idx % 4 === 0 ? "text-moss-foreground" : idx % 4 === 1 ? "text-rose-foreground" : idx % 4 === 2 ? "text-sky-foreground" : "text-lavender-foreground"
                )}>{routine.type}</span>
                <h3 className="text-lg font-semibold tracking-tight">{routine.name}</h3>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={() => deleteRoutine(routine.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startRoutine(routine)}
                  className={cn(
                    "p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all",
                    idx % 4 === 0 ? "bg-moss text-moss-foreground shadow-moss/20" : idx % 4 === 1 ? "bg-rose text-rose-foreground shadow-rose/20" : idx % 4 === 2 ? "bg-sky text-sky-foreground shadow-sky/20" : "bg-lavender text-lavender-foreground shadow-lavender/20"
                  )}
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {routine.steps && routine.steps.slice(0, 3).map((step) => (
                <div key={step.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span>{step.title}</span>
                  <span className="text-[10px] opacity-50 ml-auto">{formatTime(step.duration || 0)}</span>
                </div>
              ))}
              {routine.steps && routine.steps.length > 3 && (
                <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tighter pt-1">
                  + {routine.steps.length - 3} more steps
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {routines.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground">No routines yet</p>
              <p className="text-xs text-muted-foreground/60">Create your first routine to stay on track.</p>
            </div>
            <Link 
              to="/create-routine"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Routine
            </Link>
          </div>
        )}
      </div>

      {/* Routine Timer Mode (Full-screen Overlay) */}
      <AnimatePresence>
        {activeRoutine && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="p-8 flex justify-between items-center bg-background border-b border-border">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{activeRoutine.name}</span>
                <h2 className="text-xl font-bold tracking-tight">Step {currentStepIndex + 1} of {steps.length}</h2>
              </div>
              <button onClick={closeRoutine} className="p-3 rounded-full hover:bg-muted transition-all">
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            <div className="flex-1 flex flex-col p-8 space-y-12">
              {/* Timer Display */}
              <div className="flex flex-col items-center justify-center space-y-8">
                <motion.div
                  key={activeStepId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-2"
                >
                  <h3 className="text-4xl font-bold tracking-tighter">{currentStep.title}</h3>
                  <p className="text-lg text-muted-foreground font-medium">{currentStep.subtitle}</p>
                </motion.div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/10"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="754"
                      initial={{ strokeDashoffset: 754 }}
                      animate={{ strokeDashoffset: 754 * (1 - timeLeft / (currentStep.duration || 1)) }}
                      className="text-primary"
                    />
                  </svg>
                  <div className="text-5xl font-black tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <button
                    disabled={currentStepIndex === 0}
                    onClick={() => {
                      const prevIdx = currentStepIndex - 1;
                      const prevStep = steps[prevIdx];
                      setActiveStepId(prevStep.id);
                      setTimeLeft(prevStep.duration || 0);
                    }}
                    className="p-4 rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-6 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPaused ? <Play className="w-8 h-8 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
                  </button>
                  <button
                    onClick={() => {
                      // Mark as completed and move to next
                      if (currentStepIndex < steps.length - 1) {
                        const nextIdx = currentStepIndex + 1;
                        const nextStep = steps[nextIdx];
                        setActiveStepId(nextStep.id);
                        setTimeLeft(nextStep.duration || 0);
                      } else {
                        // All steps done
                        setIsPaused(true);
                        setTimeLeft(0);
                      }
                    }}
                    className="p-4 rounded-full border border-green-200 text-green-500 hover:bg-green-50 transition-all"
                  >
                    <Check className="w-6 h-6" />
                  </button>
                  <button
                    disabled={currentStepIndex === steps.length - 1}
                    onClick={() => {
                      const nextIdx = currentStepIndex + 1;
                      const nextStep = steps[nextIdx];
                      setActiveStepId(nextStep.id);
                      setTimeLeft(nextStep.duration || 0);
                    }}
                    className="p-4 rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Steps List with Improved Reordering - Horizontal Scroller for "at the bottom" feel */}
              <div className="space-y-4 pb-8">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Queue</h4>
                  <span className="text-[10px] font-black text-primary/40">{steps.filter(s => s.completed).length}/{steps.length} Done</span>
                </div>
                
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={cn(
                          "flex-shrink-0 w-48 transition-all duration-300",
                          "p-4 rounded-3xl border-2 flex flex-col gap-3",
                          step.id === activeStepId ? "border-primary bg-primary/5 shadow-xl scale-105" : "border-border/50 bg-card",
                          step.completed && "opacity-40 grayscale blur-[0.5px]"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black text-muted-foreground/30">#{idx + 1}</span>
                          <button 
                            onClick={() => toggleStep(step.id, idx)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                              step.completed ? "bg-primary border-primary text-primary-foreground" : "bg-white border-muted-foreground/10 hover:border-primary/30"
                            )}
                          >
                            {step.completed ? <Check className="w-4 h-4 stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />}
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <h5 className={cn("text-xs font-black tracking-tight line-clamp-1", step.completed && "line-through")}>
                            {step.title}
                          </h5>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(step.duration || 0)}
                          </div>
                        </div>

                        {step.id === activeStepId && (
                          <div className="mt-auto pt-2">
                             <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-primary"
                                  initial={{ width: "0%" }}
                                  animate={{ width: `${(1 - timeLeft / (step.duration || 1)) * 100}%` }}
                                />
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Visual cues for more content */}
                  <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                  <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Sync Routine to GCal Popup */}
      <AnimatePresence>
        {syncRoutine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/85 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5 fill-indigo-100 dark:fill-none" />
                <h3 className="text-sm font-black uppercase tracking-wider">Schedule with Google</h3>
              </div>
              
              <div className="p-4 bg-muted/40 rounded-3xl space-y-1.5 text-xs">
                <p className="font-semibold text-foreground truncate">Routine: {syncRoutine.name}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Exporting {syncRoutine.steps?.length || 0} step(s) totaling {Math.max(15, Math.ceil((syncRoutine.steps?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0) / 60))} mins as a smart calendar block.
                </p>
              </div>

              <form onSubmit={handleSyncToGoogleCalendar} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Choose Date</label>
                  <input
                    type="date"
                    required
                    value={syncDate}
                    onChange={(e) => setSyncDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-muted border border-border/10 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={syncTime}
                    onChange={(e) => setSyncTime(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-muted border border-border/10 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setSyncRoutine(null)} 
                    className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSyncingToGCal}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSyncingToGCal ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" /> EXPORTING...
                      </span>
                    ) : (
                      'EXPORT TO GCAL'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Routines;
