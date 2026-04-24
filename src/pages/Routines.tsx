import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Play, CheckCircle2, Circle, Plus, GripVertical, ChevronRight, X, SkipForward, SkipBack, Pause, RotateCcw, Clock, Trash2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { Routine, RoutineStep } from '../types';

const Routines: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [steps, setSteps] = useState<RoutineStep[]>([]);

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

  const toggleStep = (id: string) => {
    const newSteps = [...steps];
    const idx = newSteps.findIndex(s => s.id === id);
    if (idx === -1) return;

    newSteps[idx].completed = !newSteps[idx].completed;
    setSteps(newSteps);
    
    // If we completed the current active step, move to next
    if (id === activeStepId && newSteps[idx].completed) {
      if (idx < steps.length - 1) {
        const nextStep = steps[idx + 1];
        setActiveStepId(nextStep.id);
        setTimeLeft(nextStep.duration || 0);
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
              <div className="flex gap-2">
                <button onClick={() => deleteRoutine(routine.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-all">
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

              {/* Steps List with Reordering and Ticking */}
              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Next Steps</h4>
                <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                  {steps.map((step) => (
                    <Reorder.Item
                      key={step.id}
                      value={step}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center gap-4",
                        step.id === activeStepId ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card",
                        step.completed && "opacity-50 grayscale"
                      )}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground/20 cursor-grab active:cursor-grabbing" />
                      
                      <button 
                        onClick={() => toggleStep(step.id)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                          step.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/20"
                        )}
                      >
                        {step.completed && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <h5 className={cn("text-sm font-bold", step.completed && "line-through")}>{step.title}</h5>
                        <p className="text-[10px] text-muted-foreground font-medium">{formatTime(step.duration || 0)}</p>
                      </div>

                      {step.id === activeStepId && (
                        <div className="px-2 py-1 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest animate-pulse">
                          Active
                        </div>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Routines;
