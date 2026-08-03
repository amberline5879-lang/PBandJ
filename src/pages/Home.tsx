import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Plus, Clock, Flame, ChevronRight, Heart, Trash2, Palette, ListTodo, Sparkles, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, Challenge, Meal } from '../types';
import { CHALLENGES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { storage } from '../lib/storage';
import TaskEditModal from '../components/TaskEditModal';
import { isSameDay, startOfToday } from 'date-fns';
import { fetchGoogleCalendarEvents, GoogleCalendarEvent } from '../lib/calendar';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, googleSignIn } = useAuth();
  const { settings } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<(Challenge & { currentTask?: string }) | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Google Calendar Integration states
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [showGCalToday, setShowGCalToday] = useState(false);

  const interval = settings.scheduleInterval || 30;
  const totalRows = Math.floor((12 * 60) / interval);
  const rowHeight = interval === 60 ? 80 : 
                   interval === 30 ? 60 :
                   interval === 15 ? 45 :
                   interval === 10 ? 40 : 35;
  const totalHeight = totalRows * rowHeight;

  const timeToMinutes = (timeStr: string = '09:00 AM') => {
    try {
      const [time, ampm] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    } catch (e) {
      return 0;
    }
  };

  // Helper formatting for GCal event times
  const formatGCalTime = (isoString?: string) => {
    if (!isoString) return '09:00 AM';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getEventDuration = (startIso?: string, endIso?: string) => {
    if (!startIso || !endIso) return 30;
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMin = Math.round((end - start) / 60000);
    return Math.max(15, diffMin);
  };

  // Fetch Google Calendar events for today
  const loadCalendarEvents = async () => {
    if (!accessToken) return;
    setFetchingEvents(true);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const events = await fetchGoogleCalendarEvents(accessToken, start, end);
      setCalendarEvents(events);
    } catch (err) {
      console.error('Error fetching Google Calendar events on Home page:', err);
    } finally {
      setFetchingEvents(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadCalendarEvents();
    }
  }, [accessToken]);

  const scheduleTasks = tasks
    .filter(t => t.type === 'timeblock')
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Merge local timeblocks with Google Calendar events
  const googleScheduleBlocks = calendarEvents.map(event => ({
    id: `gcal-${event.id}`,
    gcalId: event.id,
    title: event.summary || '(No Title)',
    description: event.description || '',
    completed: false,
    time: formatGCalTime(event.start?.dateTime || event.start?.date),
    duration: getEventDuration(event.start?.dateTime, event.end?.dateTime),
    color: '#4F46E5', // Indigo for Google Calendar
    isGoogleCalendar: true,
    htmlLink: event.htmlLink,
  }));

  const mergedScheduleTasks = [...scheduleTasks, ...googleScheduleBlocks].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
  );

  useEffect(() => {
    const unsubTasks = storage.subscribe(storage.key.TASKS, (data) => {
      const taskList = data as Task[];
      taskList.sort((a, b) => {
        if (a.type === 'timeblock' && b.type === 'timeblock') {
          return timeToMinutes(a.time) - timeToMinutes(b.time);
        }
        return (a.order || 0) - (b.order || 0);
      });
      setTasks(taskList);
    }, user?.uid);

    const unsubChallenges = storage.subscribe(storage.key.ACTIVE_CHALLENGES, (data) => {
      const activeArr = (data as Challenge[]).filter(c => c.active);
      if (activeArr.length > 0) {
        const challengeData = activeArr[0];
        const fullChallenge = CHALLENGES.find(c => c.id === challengeData.challengeId);
        const currentDay = (challengeData.completedDays?.length || 0) + 1;
        const currentTask = fullChallenge?.days.find(d => d.dayNumber === currentDay)?.task;
        
        setActiveChallenge({ 
          ...challengeData,
          currentTask
        });
      } else {
        setActiveChallenge(null);
      }
    }, user?.uid);

    const unsubMeals = storage.subscribe(storage.key.MEALS, (data) => {
      setMeals(data as Meal[]);
    }, user?.uid);

    return () => {
      unsubTasks();
      unsubChallenges();
      unsubMeals();
    };
  }, [user?.uid]);

  const todayMeals = meals.filter(m => isSameDay(new Date(m.date), startOfToday()));

  const toggleTask = async (task: Task) => {
    try {
      await storage.update(storage.key.TASKS, task.id, { completed: !task.completed });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const addTask = async () => {
    try {
      const newTask = {
        uid: user?.uid || 'guest',
        title: 'New Task',
        completed: false,
        date: new Date().toISOString(),
        order: tasks.length,
        type: 'todo'
      };
      const id = await storage.add(storage.key.TASKS, newTask);
      setEditingTask({ id, ...newTask } as Task);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const addTimeblock = async () => {
    try {
      const newTask = {
        uid: user?.uid || 'guest',
        title: 'New Event',
        completed: false,
        date: new Date().toISOString(),
        order: tasks.filter(t => t.type === 'timeblock').length,
        type: 'timeblock',
        time: '09:00 AM',
        color: '#C7AF94', // Sand
        duration: 30,
        subtasks: []
      };
      const id = await storage.add(storage.key.TASKS, newTask);
      setEditingTask({ id, ...newTask } as Task);
    } catch (error) {
      console.error("Error adding timeblock:", error);
    }
  };

  const completeChallengeDay = async () => {
    if (!activeChallenge) return;
    
    // Just add the next day
    const nextDay = (activeChallenge.completedDays?.length || 0) + 1;
    
    if (!activeChallenge.completedDays?.includes(nextDay)) {
      try {
        await storage.update(storage.key.ACTIVE_CHALLENGES, activeChallenge.id, {
          completedDays: [...(activeChallenge.completedDays || []), nextDay]
        });
      } catch (error) {
        console.error("Error updating challenge:", error);
      }
    }
  };

  const moveToSchedule = async (task: Task, specificTime?: string, shouldEdit: boolean = true) => {
    try {
      const updates = {
        type: 'timeblock' as const,
        time: specificTime || '09:00 AM',
        order: tasks.filter(t => t.type === 'timeblock').length,
        color: '#C7AF94', // Sand
        duration: 30,
        subtasks: []
      };
      await storage.update(storage.key.TASKS, task.id, updates);
      if (shouldEdit) {
        setEditingTask({ ...task, ...updates } as Task);
      }
    } catch (error) {
      console.error('Error moving task to schedule:', error);
    }
  };

  const dragOffsetRef = useRef<number>(0);

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await storage.update(storage.key.TASKS, taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await storage.delete(storage.key.TASKS, taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Horizontal To-Do List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold tracking-tight text-primary">Today's Focus</h2>
          <button 
            onClick={addTask}
            className="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-primary/10 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {/* Meal Plan Card (Integrated into Focus) */}
          <Link to="/plan?tab=meals" className="flex-shrink-0 w-64 snap-start">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="h-full p-5 rounded-3xl bg-primary/10 border border-primary/20 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Meal Plan</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate('/add-meal');
                    }}
                    className="p-1.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-primary/40" />
                </div>
              </div>
              
              <div className="space-y-2">
                {['breakfast', 'lunch', 'dinner'].map(type => {
                  const meal = todayMeals.find(m => m.type === type);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        meal ? "bg-primary" : "bg-muted-foreground/20"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground w-16">{type}</span>
                      <span className={cn(
                        "text-xs font-medium truncate",
                        meal ? "text-foreground" : "text-muted-foreground/40 italic"
                      )}>
                        {meal ? meal.name : "Not planned"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </Link>

              {tasks.filter(t => t.type === 'todo' || !t.type).map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-shrink-0 w-48 p-4 rounded-3xl border border-border snap-start transition-all duration-300 cursor-pointer",
                    task.completed ? "bg-muted/50 border-transparent" : "bg-card shadow-sm"
                  )}
                  onClick={() => toggleTask(task)}
                >
                  <div className="flex justify-between items-start mb-3">
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{task.type || 'todo'}</span>
                  </div>
                  <p className={cn(
                    "font-medium leading-tight",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </p>
                  
                  {!task.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveToSchedule(task, '09:00 AM', true);
                      }}
                      className="mt-3 w-full py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider transition-all"
                    >
                      Schedule Task +
                    </button>
                  )}
                </motion.div>
              ))}
          
          <button 
            onClick={addTask}
            className="flex-shrink-0 w-48 p-4 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium">Add Task</span>
          </button>
        </div>
      </section>

      {/* Your Schedule Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold tracking-tight text-primary">Your Schedule</h2>
          </div>
          <div className="flex items-center gap-2">
            {accessToken ? (
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-[10px] font-bold">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Google Calendar</span>
                <button
                  onClick={loadCalendarEvents}
                  disabled={fetchingEvents}
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full transition-colors ml-1"
                  title="Refresh Google Calendar"
                >
                  <RefreshCw className={cn("w-3 h-3 text-indigo-600 dark:text-indigo-400", fetchingEvents && "animate-spin")} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => googleSignIn()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all shadow-sm"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Sync Google Calendar</span>
              </button>
            )}
            <button 
              onClick={addTimeblock}
              className="p-2 rounded-full bg-secondary text-secondary-foreground hover:opacity-90 transition-all shadow-sm"
              title="Add Timeblock"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div 
          ref={scheduleRef}
          className="relative rounded-[2.5rem] border border-border bg-secondary shadow-inner h-[500px] overflow-y-auto scrollbar-hide"
        >
          {/* Time Grid Lines */}
          <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: `${totalHeight}px` }}>
            {[...Array(totalRows)].map((_, i) => {
              const totalMinutes = i * interval;
              const hour = Math.floor(totalMinutes / 60) + 8;
              const minutes = totalMinutes % 60;
              const displayHour = hour > 12 ? hour - 12 : hour;
              const ampm = hour >= 12 ? 'pm' : 'am';
              const timeStr = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
              
              return (
                <div 
                  key={i} 
                  className="w-full border-b border-foreground/10 flex items-start"
                  style={{ height: `${rowHeight}px` }}
                >
                  <span className="text-[8px] font-bold text-foreground/30 ml-4 mt-1">
                    {timeStr}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Schedule Items */}
          <div className="relative z-10 pl-20" style={{ height: `${totalHeight}px` }}>
            <AnimatePresence mode="popLayout">
                 {mergedScheduleTasks.map((block: any) => {
                  const minutesFrom8AM = timeToMinutes(block.time) - 8 * 60;
                  const topPosition = (minutesFrom8AM / interval) * rowHeight;
                  const currentDuration = block.duration || 30;
                  const height = (currentDuration / interval) * rowHeight;

                  return (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        top: topPosition, 
                        height: height - 2,
                        zIndex: 10
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => {
                        if (block.isGoogleCalendar && block.htmlLink) {
                          window.open(block.htmlLink, '_blank');
                        } else {
                          setEditingTask(block);
                        }
                      }}
                      style={{ 
                        position: 'absolute',
                        left: '80px',
                        right: '16px',
                        top: topPosition,
                        height: height,
                        backgroundColor: block.completed 
                          ? (settings.theme === 'dark' ? '#374151' : '#E5E7EB')
                          : (block.isGoogleCalendar ? '#4F46E5' : (block.color?.startsWith('#') ? block.color : undefined))
                      }}
                      className={cn(
                        "group flex flex-col p-3 rounded-2xl border backdrop-blur-sm hover:brightness-110 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg",
                        block.completed
                          ? "border-black/5 dark:border-white/5 opacity-80"
                          : block.isGoogleCalendar 
                            ? "border-indigo-400/40 text-white shadow-indigo-600/10"
                            : "border-white/10 shadow-lg",
                        (!block.completed && !block.isGoogleCalendar && (!block.color || !block.color.startsWith('#'))) && (block.color || 'bg-moss/80'),
                      )}
                    >
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between mb-0.5 animate-in fade-in duration-300">
                          <div className="flex items-center gap-2">
                            {block.isGoogleCalendar ? (
                              <div className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-indigo-700 bg-white shadow-sm flex items-center justify-center">
                                Google Event
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  toggleTask(block);
                                }}
                                className="p-1 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-30"
                              >
                                {block.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/20" />
                                ) : (
                                  <Circle className={cn(
                                    "w-4 h-4",
                                    ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white/50 hover:text-white" : "text-black/30 hover:text-black"
                                  )} />
                                )}
                              </button>
                            )}

                            <span className={cn(
                              "text-[8px] font-black uppercase",
                              block.completed
                                ? "text-muted-foreground/50"
                                : block.isGoogleCalendar
                                  ? "text-indigo-250"
                                  : ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white/80" : "text-black/60"
                            )}>
                              {block.time || '09:00 am'} {currentDuration ? `• ${currentDuration}m` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "font-bold text-xs truncate",
                            block.completed
                              ? "line-through text-muted-foreground/50"
                              : block.isGoogleCalendar
                                ? "text-white font-semibold"
                                : ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white" : "text-black/80"
                          )}>{block.title}</p>
                          {block.subtasks && block.subtasks.length > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest",
                              block.completed
                                ? "text-muted-foreground/45"
                                : ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white/60" : "text-black/40"
                            )}>
                              <ListTodo className="w-2 h-2" />
                              {block.subtasks.filter(s => s.completed).length}/{block.subtasks.length}
                            </div>
                          )}
                        </div>
                        {block.isGoogleCalendar && block.description && (
                          <span className="text-[9px] text-indigo-200 line-clamp-1 break-all mt-0.5 italic block w-full">
                            {block.description}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                 })}
            </AnimatePresence>
            
            {mergedScheduleTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/40 space-y-2">
                <Plus className="w-8 h-8 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Add an event</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Active Challenge Card */}
      <section className="pt-4">
        {activeChallenge ? (
          <div className="relative">
            <Link to="/challenges">
              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/10 border border-primary/20 shadow-xl shadow-primary/5"
              >
                <div className="absolute right-4 top-4 opacity-10">
                  <Flame className="w-16 h-16 text-primary" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-primary/20 text-primary">
                        <Flame className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Active Challenge</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-secondary" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{activeChallenge.title}</h3>
                    <p className="text-sm text-secondary font-medium">Day {activeChallenge.completedDays.length + 1}: {activeChallenge.currentTask || 'Keep going!'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-tighter">
                      <span className="text-primary">Progress</span>
                      <span className="text-secondary">{activeChallenge.completedDays.length} / 30 Days</span>
                    </div>
                    <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden border border-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(activeChallenge.completedDays.length / 30) * 100}%` }}
                        className="h-full bg-primary"
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  
                  {/* Spacer for button */}
                  <div className="h-12" />
                </div>
              </motion.div>
            </Link>
            
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  completeChallengeDay();
                }}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
              >
                Complete Today's Task
              </button>
            </div>
          </div>
        ) : (
          <Link to="/challenges">
            <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 text-center hover:bg-muted/50 transition-all">
              <div className="p-4 rounded-full bg-muted text-muted-foreground">
                <Flame className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold tracking-tight">No Active Challenge</h3>
                <p className="text-xs text-muted-foreground font-medium">Start a 30-day challenge to build better habits.</p>
              </div>
              <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest">
                Browse Challenges
              </button>
            </div>
          </Link>
        )}
      </section>

      {/* Support Options Section */}
      <section className="space-y-6 pt-6 border-t border-border mt-12 mb-6">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#B3A183]">Support Options</h2>
          <p className="text-xs text-muted-foreground">If you're feeling overwhelmed, these free Australian resources are here to help you 24/7.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              name: "Lifeline",
              phone: "13 11 14",
              phoneUrl: "131114",
              website: "lifeline.org.au",
              bestFor: "Immediate crisis support, suicide prevention, and emotional distress."
            },
            {
              name: "Beyond Blue",
              phone: "1300 22 4636",
              phoneUrl: "1300224636",
              website: "beyondblue.org.au",
              bestFor: "Support with depression, anxiety, everyday stress, and peer community forums."
            },
            {
              name: "Kids Helpline",
              phone: "1800 55 1800",
              phoneUrl: "1800551800",
              website: "kidshelpline.com.au",
              bestFor: "Free, private counselling for young people aged 5 to 25."
            },
            {
              name: "Suicide Call Back Service",
              phone: "1300 659 467",
              phoneUrl: "1300659467",
              website: "suicidecallbackservice.org.au",
              bestFor: "Immediate professional 24/7 telephone and online counselling."
            }
          ].map((srv, i) => (
            <div key={i} className="p-5 rounded-3xl bg-secondary/30 border border-border/40 hover:border-primary/20 transition-all space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <h3 className="font-bold text-sm text-foreground">{srv.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded">24/7 Available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground/50">Phone:</span>
                  <a href={`tel:${srv.phoneUrl}`} className="text-primary hover:underline font-bold text-sm">{srv.phone}</a>
                </div>
                <div className="flex items-start sm:items-center gap-1.5 text-muted-foreground min-w-0">
                  <span className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground/50 mt-1 sm:mt-0 flex-shrink-0">Website:</span>
                  <a href={`https://${srv.website}`} target="_blank" rel="noopener noreferrer" className="text-[#B3A183] hover:underline font-bold break-all">{srv.website}</a>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground/42 block mb-0.5">Best for:</span>
                {srv.bestFor}
              </p>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {editingTask && (
          <TaskEditModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(updates) => updateTask(editingTask.id, updates)}
            onDelete={deleteTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
