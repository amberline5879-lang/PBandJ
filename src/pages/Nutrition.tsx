import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Utensils, Droplets, Apple, Info, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { Meal } from '../types';
import { format } from 'date-fns';

const Nutrition: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [water, setWater] = useState(0); // Liters
  const waterGoal = 2.0;
  const calorieGoal = 2200;

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const unsubHydration = storage.subscribe('serene_hydration', (data) => {
      const todayData = (data as any[]).find(h => h.date === today);
      setWater(todayData ? todayData.amount : 0);
    });

    const unsubMeals = storage.subscribe(storage.key.MEALS, (data) => {
      const dailyMeals = (data as Meal[]).filter(m => format(new Date(m.date), 'yyyy-MM-dd') === today);
      setMeals(dailyMeals);
    });

    return () => {
      unsubHydration();
      unsubMeals();
    };
  }, []);

  const updateWater = async (newAmount: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const cappedAmount = Math.min(newAmount, 10); // Cap at 10L

    try {
      const data = await storage.getAll<any>('serene_hydration');
      const todayDoc = data.find(h => h.date === today);
      
      if (todayDoc) {
        await storage.update('serene_hydration', todayDoc.id, { 
          amount: cappedAmount,
          updatedAt: new Date().toISOString()
        });
      } else {
        await storage.add('serene_hydration', {
          uid: user?.uid || 'guest',
          date: today,
          amount: cappedAmount,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating water:", error);
    }
  };

  const totalCalories = meals.reduce((acc, meal) => acc + (meal.calories || 0), 0);
  const totalProtein = meals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const remainingCalories = Math.max(0, calorieGoal - totalCalories);
  const progress = Math.min(100, (totalCalories / calorieGoal) * 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md p-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-accent hover:bg-accent/10 rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-accent tracking-tight">Nutrition</h1>
      </header>

      <main className="p-6 space-y-8">
        {/* Calorie Stat */}
        <div className="text-center space-y-2">
          <div className="p-6 rounded-full bg-accent/10 text-accent w-fit mx-auto">
            <Utensils className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-foreground">{totalCalories}</h2>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Calories Consumed Today</p>
        </div>

        {/* Progress Card */}
        <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">Daily Goal</h3>
              <p className="text-xs text-muted-foreground">{remainingCalories} kcal remaining</p>
            </div>
            <span className="text-3xl font-black text-accent">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center space-y-1">
              <Apple className="w-4 h-4 text-accent/40 mx-auto" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Protein</p>
              <p className="text-sm font-bold text-foreground">{totalProtein}g</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-4 h-4 text-accent/40 mx-auto font-bold text-[8px] flex items-center justify-center border border-accent/40 rounded-full">C</div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Carbs</p>
              <p className="text-sm font-bold text-foreground">--g</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-4 h-4 text-accent/40 mx-auto font-bold text-[8px] flex items-center justify-center border border-accent/40 rounded-full">F</div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Fats</p>
              <p className="text-sm font-bold text-foreground">--g</p>
            </div>
          </div>
        </div>

        {/* Hydration Card */}
        <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-secondary/20 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 rounded-2xl bg-secondary/20 text-secondary shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">Hydration</h3>
                <p className="text-xs text-muted-foreground">{water}L / {waterGoal}L Goal</p>
              </div>
            </div>
            <button 
              onClick={() => updateWater(water + 0.25)}
              className="p-3 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-200 hover:opacity-90 transition-all shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="h-4 bg-blue-100 rounded-full overflow-hidden border border-blue-200">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(water / waterGoal) * 100}%` }}
              className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>

        {/* Apple Health Placeholder */}
        <div className="p-6 rounded-[2rem] bg-accent/5 border border-accent/10 flex items-start gap-4">
          <Info className="w-5 h-5 text-accent mt-1" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Apple Health Integration</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sync your nutrition data from Apple Health to automatically track your micronutrients and hydration levels.
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            console.log("Navigating to meal plan");
            navigate('/plan?tab=meals');
          }}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          Go to Meal Plan
        </button>
      </main>
    </div>
  );
};

export default Nutrition;
