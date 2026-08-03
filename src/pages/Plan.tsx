import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Utensils, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  Clock, 
  ShoppingBag,
  RefreshCw,
  LogIn,
  Link2,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  format, 
  startOfToday, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameMonth,
  startOfDay,
  endOfDay
} from 'date-fns';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { Meal, Workout } from '../types';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  fetchGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent, 
  GoogleCalendarEvent 
} from '../lib/calendar';

const Plan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, googleSignIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab priority: state > query param > default
  const initialTab = (location.state as any)?.activeTab || (searchParams.get('tab') as 'meals' | 'workouts' | 'calendar') || 'meals';
  const [activeTab, setActiveTab] = useState<'meals' | 'workouts' | 'calendar'>(initialTab);
  const [activeMealType, setActiveMealType] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [activeWorkoutType, setActiveWorkoutType] = useState<'all' | 'strength' | 'cardio' | 'yoga' | 'other'>('all');
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  // Google Calendar States
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // General add modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<string>('');

  // Google calendar custom event modal
  const [showGoogleEventModal, setShowGoogleEventModal] = useState(false);
  const [gEventTitle, setGEventTitle] = useState('');
  const [gEventDesc, setGEventDesc] = useState('');
  const [gEventStartHour, setGEventStartHour] = useState('09:00');
  const [gEventEndHour, setGEventEndHour] = useState('10:00');
  const [addingGEvent, setAddingGEvent] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'meals' || tabParam === 'workouts' || tabParam === 'calendar') {
      setActiveTab(tabParam);
    } else if ((location.state as any)?.activeTab) {
      const stateTab = (location.state as any).activeTab;
      if (stateTab === 'meals' || stateTab === 'workouts' || stateTab === 'calendar') {
        setActiveTab(stateTab);
      }
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

  // Fetch Google Calendar Events for selected Date
  const loadCalendarEvents = async () => {
    if (!accessToken) return;
    setFetchingEvents(true);
    setCalendarError(null);
    try {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);
      const events = await fetchGoogleCalendarEvents(accessToken, dayStart, dayEnd);
      setCalendarEvents(events);
    } catch (err: any) {
      console.error('Error fetching calendar events for selected date:', err);
      setCalendarError('Failed to load Google Calendar events.');
    } finally {
      setFetchingEvents(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadCalendarEvents();
    }
  }, [accessToken, selectedDate]);

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

  // Add Google Calendar Event
  const handleAddGoogleEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gEventTitle.trim() || !accessToken) return;

    setAddingGEvent(true);
    try {
      const [startH, startM] = gEventStartHour.split(':').map(Number);
      const [endH, endM] = gEventEndHour.split(':').map(Number);

      const start = new Date(selectedDate);
      start.setHours(startH, startM, 0, 0);

      const end = new Date(selectedDate);
      end.setHours(endH, endM, 0, 0);

      const newEv = await createGoogleCalendarEvent(
        accessToken,
        gEventTitle.trim(),
        gEventDesc.trim(),
        start,
        end
      );

      setCalendarEvents(prev => [...prev, newEv]);
      setGEventTitle('');
      setGEventDesc('');
      setShowGoogleEventModal(false);
    } catch (err: any) {
      console.error('Add Calendar event failed:', err);
      alert('Event creation failed. Please try again.');
    } finally {
      setAddingGEvent(false);
    }
  };

  // Delete Google Calendar Event safely with explicit confirm validation
  const handleDeleteGoogleEvent = async (eventId: string, eventSummary: string) => {
    try {
      const success = await deleteGoogleCalendarEvent(accessToken!, eventId, eventSummary);
      if (success) {
        setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (err) {
      console.error('Delete Calendar Event failed:', err);
      alert('Failed to delete Google Calendar event.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Three-Way Tab Switcher */}
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
        <button
          onClick={() => setActiveTab('calendar')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'calendar' ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarIcon className="w-4 h-4" />
          Google Sync
        </button>
      </div>

      {/* Collapsible Calendar Date Picker */}
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

      {/* Primary Panels rendering based on active tab */}
      <section className="space-y-6">
        
        {/* Tab-headers with specialized Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold tracking-tight text-primary">
            {activeTab === 'meals' ? "Planned Meals" : activeTab === 'workouts' ? "Planned Workouts" : `Google Calendar (${format(selectedDate, 'MMM d')})`}
          </h2>
          <div className="flex items-center gap-2">
            {activeTab === 'meals' && (
              <>
                <button 
                  onClick={() => navigate('/recipes')}
                  className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center"
                  title="Recipe Book"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => navigate('/shopping-list')}
                  className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center"
                  title="Shopping List"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </>
            )}

            {activeTab === 'calendar' && accessToken && (
              <button
                onClick={loadCalendarEvents}
                disabled={fetchingEvents}
                className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition-all"
                title="Refresh Calendar"
              >
                <RefreshCw className={cn("w-4 h-4", fetchingEvents && "animate-spin")} />
              </button>
            )}
            
            <button 
              onClick={() => {
                if (activeTab === 'meals') {
                  const type = activeMealType === 'all' ? 'breakfast' : activeMealType;
                  navigate(`/add-meal?type=${type}&date=${selectedDate.toISOString()}`);
                } else if (activeTab === 'workouts') {
                  const type = activeWorkoutType === 'all' ? 'strength' : activeWorkoutType;
                  navigate(`/add-workout?type=${type}&date=${selectedDate.toISOString()}`);
                } else {
                  if (!accessToken) {
                    googleSignIn();
                  } else {
                    setShowGoogleEventModal(true);
                  }
                }
              }}
              className={cn(
                "p-2 rounded-full transition-all",
                activeTab === 'calendar' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-primary hover:bg-primary/10"
              )}
              title={activeTab === 'calendar' ? "Add Google Event" : "Add Item"}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic subcategory filtering buttons */}
        {activeTab === 'meals' && (
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
        )}

        {activeTab === 'workouts' && (
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

        {/* Main List Rendering */}
        <div className="space-y-4">
          
          {/* MEALS RENDERER */}
          {activeTab === 'meals' && (
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
          )}

          {/* WORKOUTS RENDERER */}
          {activeTab === 'workouts' && (
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

          {/* GOOGLE CALENDAR RENDERER */}
          {activeTab === 'calendar' && (
            !accessToken ? (
              <div className="text-center p-8 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-[2.5rem] border border-indigo-200 dark:border-indigo-800 space-y-4">
                <CalendarIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-foreground">Connect Google Calendar</h3>
                  <p className="text-xs text-muted-foreground">
                    Sign in with your Google account to view, add, and manage your events for {format(selectedDate, 'EEEE, MMMM d')}.
                  </p>
                </div>
                <button
                  onClick={() => googleSignIn()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In with Google
                </button>
              </div>
            ) : fetchingEvents ? (
              <div className="text-center py-12 bg-muted/30 rounded-[2.5rem] border border-border">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Fetching Google Calendar events...</p>
              </div>
            ) : calendarEvents.length > 0 ? (
              <div className="space-y-3">
                {calendarEvents.map((event) => {
                  const startTime = event.start?.dateTime 
                    ? format(new Date(event.start.dateTime), 'h:mm a') 
                    : 'All Day';
                  const endTime = event.end?.dateTime 
                    ? format(new Date(event.end.dateTime), 'h:mm a') 
                    : '';

                  return (
                    <motion.div
                      key={event.id}
                      whileHover={{ y: -2 }}
                      className="p-5 rounded-3xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 rounded-full">
                              {startTime} {endTime ? `- ${endTime}` : ''}
                            </span>
                            {event.location && (
                              <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">
                                📍 {event.location}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-foreground tracking-tight">{event.summary || '(No Title)'}</h3>
                        </div>

                        <div className="flex items-center gap-1">
                          {event.htmlLink && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 transition-all"
                              title="Open in Google Calendar"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteGoogleEvent(event.id, event.summary || 'Event')}
                            className="p-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 transition-all"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-[2.5rem] border border-dashed border-border space-y-3">
                <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto opacity-30" />
                <p className="text-sm text-muted-foreground">No Google Calendar events for {format(selectedDate, 'MMM d, yyyy')}</p>
                <button
                  onClick={() => setShowGoogleEventModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Event
                </button>
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

      {/* CREATE GOOGLE CALENDAR EVENT MODAL */}
      {showGoogleEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">New Google Event</h3>
              <span className="text-xs text-indigo-600 font-semibold">{format(selectedDate, 'MMM d')}</span>
            </div>
            
            <form onSubmit={handleAddGoogleEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Event Title</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={gEventTitle}
                  onChange={(e) => setGEventTitle(e.target.value)}
                  placeholder="e.g., Doctor Appointment"
                  className="w-full p-3 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Start Time</label>
                  <input
                    type="time"
                    value={gEventStartHour}
                    onChange={(e) => setGEventStartHour(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-indigo-600 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">End Time</label>
                  <input
                    type="time"
                    value={gEventEndHour}
                    onChange={(e) => setGEventEndHour(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-indigo-600 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Description (Optional)</label>
                <textarea
                  value={gEventDesc}
                  onChange={(e) => setGEventDesc(e.target.value)}
                  placeholder="Notes or details..."
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-indigo-600 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowGoogleEventModal(false)} 
                  className="flex-1 py-3 rounded-xl bg-muted text-xs font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingGEvent}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                  {addingGEvent ? 'Creating...' : 'Save to GCal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
