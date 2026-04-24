import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Clock, Save, Coffee, Sun, Moon, Zap, Activity, Heart, Brain, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';

console.log("CreateRoutine.tsx file loaded");

const ICONS = [
  { id: 'coffee', icon: Coffee },
  { id: 'sun', icon: Sun },
  { id: 'moon', icon: Moon },
  { id: 'zap', icon: Zap },
  { id: 'activity', icon: Activity },
  { id: 'heart', icon: Heart },
  { id: 'brain', icon: Brain },
  { id: 'sparkles', icon: Sparkles },
];

interface StepEntry {
  id: string;
  title: string;
  duration: string; // in minutes
  icon: string;
}

const RoutineStepItem = ({ step, updateStep, removeStep }: { 
  step: StepEntry, 
  updateStep: (id: string, field: keyof StepEntry, value: string) => void,
  removeStep: (id: string) => void 
}) => {
  return (
    <div className="p-5 rounded-[2rem] bg-card border border-border shadow-sm flex items-center gap-4 group">
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={step.title}
            onChange={(e) => updateStep(step.id, 'title', e.target.value)}
            placeholder="Step name..."
            className="flex-1 bg-background border border-border/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30 transition-all"
          />
          <div className="relative w-full sm:w-28 flex-shrink-0">
            <input
              type="number"
              value={step.duration}
              onChange={(e) => updateStep(step.id, 'duration', e.target.value)}
              className="w-full bg-background border border-border/50 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary pr-12 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-muted-foreground/40 uppercase">min</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1 -mx-1">
          {ICONS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => updateStep(step.id, 'icon', id)}
              className={cn(
                "p-3 rounded-xl transition-all flex-shrink-0 border-2",
                step.icon === id 
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                  : "bg-background text-muted-foreground/40 border-border/50 hover:border-primary/30 hover:text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => removeStep(step.id)}
        className="p-2 text-muted-foreground/30 hover:text-red-500 transition-all opacity-100 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const CreateRoutine: React.FC = () => {
  console.log("CreateRoutine component rendering");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<StepEntry[]>([
    { id: '1', title: '', duration: '5', icon: 'sun' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log("CreateRoutine useEffect, user:", user?.uid);
  }, [user]);

  const addStep = () => {
    const newId = Math.random().toString(36).substring(2, 11);
    setSteps([...steps, { id: newId, title: '', duration: '5', icon: 'sun' }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id));
    }
  };

  const updateStep = (id: string, field: keyof StepEntry, value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const totalMinutes = steps.reduce((acc, s) => acc + (parseInt(s.duration) || 0), 0);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);

    const order = Date.now();

    const routineData = {
      uid: user?.uid || 'guest',
      name: title.trim(),
      type: 'custom',
      order,
      steps: steps.map((s, idx) => ({
        id: `s${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: s.title || 'Untitled Step',
        subtitle: `${s.duration} min`,
        duration: (parseInt(s.duration) || 0) * 60,
        icon: s.icon,
        completed: false
      })),
      createdAt: new Date().toISOString()
    };

    try {
      await storage.add(storage.key.ROUTINES, routineData);
      navigate('/routines');
    } catch (error) {
      console.error('Error saving routine:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    console.log("CreateRoutine: No user, showing loading");
    return <div className="p-8 text-center bg-red-50">Loading user profile... (If this persists, check auth)</div>;
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-primary tracking-tight">Create Routine</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-bold">{totalMinutes} min</span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-4">Routine Title</label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Morning Focus"
            className="w-full p-6 rounded-[2rem] bg-card border border-border shadow-sm focus:ring-2 focus:ring-primary text-lg font-bold tracking-tight placeholder:text-muted-foreground/20"
          />
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Routine Steps</label>
            <span className="text-[10px] font-bold text-muted-foreground/40">{steps.length} items</span>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <RoutineStepItem 
                key={step.id} 
                step={step} 
                updateStep={updateStep} 
                removeStep={removeStep} 
              />
            ))}
          </div>

          <button
            onClick={addStep}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Routine"}
        </button>
      </div>
    </div>
  );
};

export default CreateRoutine;
