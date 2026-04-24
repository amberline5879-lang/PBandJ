import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Utensils, Dumbbell, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, ExternalLink, Trash2, GripVertical, Sparkles, Clock, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { Meal, Workout } from '../types';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const Plan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab priority: state > query param > default
  const initialTab = (location.state as any)?.activeTab || (searchParams.get('tab') as 'meals' | 'workouts') || 'meals';
  const [activeTab, setActiveTab] = useState<'meals' | 'workouts'>(initialTab);
  const [activeMealType, setActiveMealType] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [activeWorkoutType, setActiveWorkoutType] = useState<'all' | 'strength' | 'cardio' | 'yoga' | 'other'>('all');
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<string>('');

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as 'meals' | 'workouts');
    } else if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    const unsubMeals = storage.subscribe(storage.key.MEALS, (data) => setMeals(data as Meal[]));
    const unsubWorkouts = storage.subscribe(storage.key.WORKOUTS, (data) => setWorkouts(data as Workout[]));
    return () => {
      unsubMeals();
      unsubWorkouts();
    };
  }, []);

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const filteredMeals = meals.filter(m => {
    const dateMatch = isSameDay(new Date(m.date), selectedDate);
    const typeMatch = activeMealType === 'all' || m.type === activeMealType;
    return dateMatch && typeMatch;
  });
  const filteredWorkouts = workouts.filter(w => {
    const dateMatch = isSameDay(new Date(w.date), selectedDate);
    const typeMatch = activeWorkoutType === 'all' || w.type === activeWorkoutType;
    return dateMatch && typeMatch;
  });

  const addItem = async () => {
    if (!newItemName.trim()) return;
    const key = activeTab === 'meals' ? storage.key.MEALS : storage.key.WORKOUTS;
    
    const type = newItemType || (activeTab === 'meals' ? (activeMealType === 'all' ? 'breakfast' : activeMealType) : (activeWorkoutType === 'all' ? 'strength' : activeWorkoutType));

    const newItem = {
      uid: user?.uid || 'guest',
      name: newItemName.trim(),
      date: selectedDate.toISOString(),
      type: type,
      ...(activeTab === 'workouts' ? { duration: '30 min' } : {})
    };

    try {
      await storage.add(key, newItem);
      setNewItemName('');
      setNewItemType('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    const key = activeTab === 'meals' ? storage.key.MEALS : storage.key.WORKOUTS;
    try {
      await storage.delete(key, id);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Tab Switcher */}
      <div className="flex p-1.5 rounded-2xl bg-muted/50 border border-border">
        <button
          onClick={() => setActiveTab('meals')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'meals' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Utensils className="w-4 h-4" />
          Meals
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'workouts' ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Dumbbell className="w-4 h-4" />
          Workouts
        </button>
      </div>

      {/* Collapsible Calendar */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex-1 flex justify-between items-center p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold tracking-tight">{format(currentMonth, 'MMMM yyyy')}</span>
            </div>
            {isCalendarExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); prevMonth(); }}
              className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:bg-muted transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextMonth(); }}
              className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:bg-muted transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isCalendarExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-[2.5rem] bg-card border border-border shadow-sm">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-muted-foreground/40 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, startOfToday());
                    
                    return (
                      <button 
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative",
                          isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 z-10" : 
                          isToday ? "bg-primary/10 text-primary" :
                          isCurrentMonth ? "hover:bg-muted text-foreground" : "text-muted-foreground/30"
                        )}
                      >
                        {format(day, 'd')}
                        {isSelected && (
                          <motion.div 
                            layoutId="activeDay"
                            className="absolute inset-0 border-2 border-primary rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Content Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold tracking-tight text-primary">
            {activeTab === 'meals' ? "Planned Meals" : "Planned Workouts"}
          </h2>
          <div className="flex items-center gap-2">
            {activeTab === 'meals' && (
              <button 
                onClick={() => navigate('/shopping-list')}
                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => {
                if (activeTab === 'meals') {
                  const type = activeMealType === 'all' ? 'breakfast' : activeMealType;
                  navigate(`/add-meal?type=${type}&date=${selectedDate.toISOString()}`);
                } else {
                  const type = activeWorkoutType === 'all' ? 'strength' : activeWorkoutType;
                  navigate(`/add-workout?type=${type}&date=${selectedDate.toISOString()}`);
                }
              }}
              className="text-primary p-2 rounded-full hover:bg-primary/10 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'meals' ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveMealType(type)}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                  activeMealType === type 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'strength', 'cardio', 'yoga', 'other'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveWorkoutType(type)}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                  activeWorkoutType === type 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {activeTab === 'meals' ? (
            filteredMeals.length > 0 ? (
              filteredMeals.map((meal) => (
                <motion.div
                  key={meal.id}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "group p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300",
                    meal.type === 'breakfast' ? "bg-rose/20 border-rose/30" : 
                    meal.type === 'lunch' ? "bg-sky/20 border-sky/30" : 
                    meal.type === 'dinner' ? "bg-moss/20 border-moss/30" : "bg-lavender/20 border-lavender/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        meal.type === 'breakfast' ? "text-rose-foreground" : 
                        meal.type === 'lunch' ? "text-sky-foreground" : 
                        meal.type === 'dinner' ? "text-moss-foreground" : "text-lavender-foreground"
                      )}>{meal.type}</span>
                      <h3 className="text-lg font-semibold tracking-tight">{meal.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/meal/${meal.id}`)}
                        className="p-2 rounded-full hover:bg-primary/20 transition-all text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem(meal.id)} className="p-2 rounded-full hover:bg-primary/20 transition-all text-primary">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {meal.recipe && <p className="text-sm text-muted-foreground font-medium leading-relaxed">{meal.recipe}</p>}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-[2.5rem] border border-dashed border-border">
                <Utensils className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No meals planned for today</p>
              </div>
            )
          ) : (
            filteredWorkouts.length > 0 ? (
              filteredWorkouts.map((workout) => (
                <motion.div
                  key={workout.id}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "group p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300",
                    workout.type === 'strength' ? "bg-sky/20 border-sky/30" : 
                    workout.type === 'cardio' ? "bg-rose/20 border-rose/30" : 
                    workout.type === 'yoga' ? "bg-moss/20 border-moss/30" : "bg-lavender/20 border-lavender/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{workout.duration}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">• {workout.type}</span>
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight">{workout.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/workout/${workout.id}`)}
                        className="p-2 rounded-full hover:bg-black/5 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem(workout.id)} className="p-2 rounded-full hover:bg-black/5 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button className={cn(
                    "w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all",
                    workout.type === 'strength' ? "bg-sky text-sky-foreground" : 
                    workout.type === 'cardio' ? "bg-rose text-rose-foreground" : 
                    workout.type === 'yoga' ? "bg-moss text-moss-foreground" : "bg-lavender text-lavender-foreground"
                  )}>
                    Start Workout
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-[2.5rem] border border-dashed border-border">
                <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">Rest day! No workouts planned</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* AI Suggestions Card */}
      <section className="pt-4">
        <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/20 text-primary">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">AI Coach Suggestion</span>
          </div>
          
          <p className="text-sm text-foreground font-medium italic leading-relaxed">
            "Based on your energy levels today, I recommend a high-protein dinner and a 15-minute stretching session before bed."
          </p>
          
          <button className="text-xs font-bold uppercase tracking-widest text-primary hover:underline transition-all">
            Add to plan
          </button>
        </div>
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl space-y-4"
          >
            <h3 className="text-xl font-bold text-center">Add {activeTab === 'meals' ? 'Meal' : 'Workout'}</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={activeTab === 'meals' ? "e.g., Quinoa Salad" : "e.g., Full Body HIIT"}
                  className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {activeTab === 'meals' ? (
                    (['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewItemType(type)}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                          newItemType === type ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"
                        )}
                      >
                        {type}
                      </button>
                    ))
                  ) : (
                    (['strength', 'cardio', 'yoga', 'other'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewItemType(type)}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                          newItemType === type ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"
                        )}
                      >
                        {type}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-muted text-xs font-bold uppercase tracking-widest">Cancel</button>
              <button onClick={addItem} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest">Add</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Plan;
