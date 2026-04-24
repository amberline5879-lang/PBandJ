import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Droplets, Sparkles, Activity, Moon, Utensils, Dumbbell, Brain, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

const PHASE_DATA: Record<string, any> = {
  'menstrual': {
    name: 'Menstrual Phase',
    icon: Droplets,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    duration: 'Days 1-5',
    description: 'The first day of your period marks the beginning of your cycle. Progesterone and estrogen are at their lowest levels, which can lead to lower energy and a desire for inward reflection.',
    nutrition: {
      title: 'Warm & Nourishing',
      items: ['Iron-rich foods (spinach, lentils)', 'Warm soups and stews', 'Healthy fats (avocado, nuts)', 'Hydrating herbal teas']
    },
    fitness: {
      title: 'Rest & Restore',
      items: ['Gentle yoga', 'Walking', 'Stretching', 'Full rest days']
    },
    mindset: {
      title: 'Reflection',
      items: ['Journaling', 'Meditation', 'Setting intentions', 'Prioritizing sleep']
    }
  },
  'follicular': {
    name: 'Follicular Phase',
    icon: Sparkles,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    duration: 'Days 6-13',
    description: 'Estrogen begins to rise, bringing an increase in energy, creativity, and social desire. This is the "Spring" of your cycle, a time for new beginnings and planning.',
    nutrition: {
      title: 'Light & Fresh',
      items: ['Fermented foods (kimchi, sauerkraut)', 'Fresh salads', 'Lean proteins', 'Cruciferous vegetables']
    },
    fitness: {
      title: 'Try Something New',
      items: ['Dancing', 'New workout classes', 'Hiking', 'Moderate strength training']
    },
    mindset: {
      title: 'Creativity',
      items: ['Brainstorming', 'Starting new projects', 'Socializing', 'Learning new skills']
    }
  },
  'ovulatory': {
    name: 'Ovulatory Phase',
    icon: Activity,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    duration: 'Days 14-16',
    description: 'Estrogen peaks and testosterone rises, leading to your highest energy levels and peak communication skills. This is the "Summer" of your cycle.',
    nutrition: {
      title: 'Vibrant & Cooling',
      items: ['Raw vegetables', 'Fruit smoothies', 'Anti-inflammatory foods', 'Light grains']
    },
    fitness: {
      title: 'Peak Performance',
      items: ['HIIT workouts', 'Heavy lifting', 'Running', 'Group fitness']
    },
    mindset: {
      title: 'Connection',
      items: ['Public speaking', 'Important meetings', 'Date nights', 'Social events']
    }
  },
  'luteal': {
    name: 'Luteal Phase',
    icon: Moon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    duration: 'Days 17-28',
    description: 'Progesterone rises, which can bring a more grounded, inward energy. This is the "Autumn" of your cycle, a time for completion and organization.',
    nutrition: {
      title: 'Grounding & Complex',
      items: ['Complex carbs (sweet potatoes)', 'Magnesium-rich foods (dark chocolate)', 'Root vegetables', 'Fiber-rich foods']
    },
    fitness: {
      title: 'Strength & Flow',
      items: ['Strength training', 'Pilates', 'Power yoga', 'Steady-state cardio']
    },
    mindset: {
      title: 'Organization',
      items: ['Finishing projects', 'Decluttering', 'Meal prepping', 'Self-care rituals']
    }
  }
};

const CyclePhaseDetail: React.FC = () => {
  const { phaseId } = useParams<{ phaseId: string }>();
  const navigate = useNavigate();
  const phase = PHASE_DATA[phaseId || 'menstrual'];

  if (!phase) return <div>Phase not found</div>;

  return (
    <div className="min-h-screen bg-[#FBF9F4] pb-24">
      <header className="sticky top-0 z-30 bg-[#FBF9F4]/80 backdrop-blur-md p-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className={cn("p-2 rounded-full transition-all", phase.bg, phase.color)}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="space-y-0.5">
          <h1 className={cn("text-xl font-bold tracking-tight", phase.color)}>{phase.name}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{phase.duration}</p>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Intro Card */}
        <div className="p-8 rounded-[2.5rem] bg-white border border-border shadow-sm space-y-4">
          <div className={cn("p-4 rounded-full w-fit", phase.bg, phase.color)}>
            <phase.icon className="w-8 h-8" />
          </div>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {phase.description}
          </p>
        </div>

        {/* Nutrition */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <h3 className="text-lg font-bold text-[#4A3728]">Nutrition</h3>
          </div>
          <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600">{phase.nutrition.title}</h4>
            <ul className="space-y-2">
              {phase.nutrition.items.map((item: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-emerald-900/80 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fitness */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Dumbbell className="w-4 h-4 text-orange-500" />
            <h3 className="text-lg font-bold text-[#4A3728]">Fitness</h3>
          </div>
          <div className="p-6 rounded-[2rem] bg-orange-50 border border-orange-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-orange-600">{phase.fitness.title}</h4>
            <ul className="space-y-2">
              {phase.fitness.items.map((item: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-orange-900/80 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mindset */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <h3 className="text-lg font-bold text-[#4A3728]">Mindset</h3>
          </div>
          <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600">{phase.mindset.title}</h4>
            <ul className="space-y-2">
              {phase.mindset.items.map((item: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-indigo-900/80 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="p-8 rounded-[2.5rem] bg-secondary/30 border border-border/50 text-center space-y-4">
          <div className="p-4 rounded-full bg-secondary text-secondary-foreground w-fit mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <p className="text-xs text-muted-foreground font-medium max-w-[240px] mx-auto leading-relaxed">
            Remember to listen to your body first. These are general guidelines to help you find your unique rhythm.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CyclePhaseDetail;
