import React from 'react';
import { motion } from 'motion/react';
import { Heart, ChevronRight, Activity, Moon, Utensils, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTheme } from '../components/ThemeProvider';

const Health: React.FC = () => {
  const { settings } = useTheme();
  
  const healthCategories = [
    {
      title: 'Cycle Tracking',
      description: 'Monitor your hormonal health and patterns.',
      icon: Droplets,
      path: '/health/cycle',
      color: 'text-[#D46A7E]',
      bg: 'bg-[#FFD1DC]',
      show: settings.showCycleTracking
    },
    {
      title: 'Sleep Quality',
      description: 'Track your rest and recovery cycles.',
      icon: Moon,
      path: '/health/sleep',
      color: 'text-[#3F51B5]',
      bg: 'bg-[#E8EAF6]',
      show: true
    },
    {
      title: 'Nutrition',
      description: 'Mindful eating and hydration tracking.',
      icon: Utensils,
      path: '/health/nutrition',
      color: 'text-[#00796B]',
      bg: 'bg-[#E0F2F1]',
      show: true
    },
    {
      title: 'Activity',
      description: 'Movement and energy level monitoring.',
      icon: Activity,
      path: '/health/activity',
      color: 'text-[#FBC02D]',
      bg: 'bg-[#FFF9C4]',
      show: true
    }
  ].filter(c => c.show);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Heart className="w-6 h-6" />
          <h1 className="text-3xl font-black tracking-tighter">Health & Well-being</h1>
        </div>
        <p className="text-muted-foreground font-medium">Nurture your body and mind with mindful tracking.</p>
      </header>

      <div className="grid gap-4">
        {healthCategories.map((category, index) => (
          <Link key={index} to={category.path}>
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                "flex items-center gap-4 p-6 rounded-[2rem] bg-card border-2 transition-all group shadow-sm hover:shadow-md",
                category.bg.replace('bg-', 'border-')
              )}
            >
              <div className={cn("p-4 rounded-2xl", category.bg, category.color)}>
                <category.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold tracking-tight">{category.title}</h3>
                <p className="text-xs text-muted-foreground font-medium">{category.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>
        ))}
      </div>

      <section className="p-8 rounded-[2.5rem] bg-secondary/30 border border-border/50 text-center space-y-4">
        <div className="p-4 rounded-full bg-secondary text-secondary-foreground w-fit mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold tracking-tight">Holistic Health</h3>
          <p className="text-xs text-muted-foreground font-medium max-w-[240px] mx-auto">
            Understanding your body's natural rhythms helps you plan your life more effectively.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Health;
