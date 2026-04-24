import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Plus, GripVertical, Clock, Flame, ChevronRight, Heart, Trash2, Palette, ListTodo } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, Challenge, Meal } from '../types';
import { CHALLENGES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { storage } from '../lib/storage';
import TaskEditModal from '../components/TaskEditModal';
import { isSameDay, startOfToday } from 'date-fns';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<(Challenge & { currentTask?: string }) | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [resizingTask, setResizingTask] = useState<{ id: string, duration: number } | null>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);

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

  const scheduleTasks = tasks
    .filter(t => t.type === 'timeblock')
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

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
    });

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
    });

    const unsubMeals = storage.subscribe(storage.key.MEALS, (data) => {
      setMeals(data as Meal[]);
    });

    return () => {
      unsubTasks();
      unsubChallenges();
      unsubMeals();
    };
  }, []);

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
                  drag
                  dragSnapToOrigin
                  onDragStart={(e, info) => {
                    const target = e.currentTarget as HTMLElement;
                    if (!target) return;
                    const rect = target.getBoundingClientRect();
                    dragOffsetRef.current = info.point.y - rect.top;
                  }}
                  onDragEnd={(e, info) => {
                    const scheduleElement = scheduleRef.current;
                    if (!scheduleElement) return;
                    
                    const rect = scheduleElement.getBoundingClientRect();
                    const x = info.point.x;
                    const y = info.point.y;
                    
                    // Check if dropped inside the schedule container (with margin)
                    const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

                    if (isInside) {
                      console.log("Task dropped inside schedule:", task.title);
                      const relativeY = y - rect.top + scheduleElement.scrollTop;
                      const pixelsPerMinute = rowHeight / interval;
                      const totalMinutes = Math.round(relativeY / (pixelsPerMinute * interval)) * interval;
                      
                      const hour = Math.floor(totalMinutes / 60) + 8;
                      const minutes = totalMinutes % 60;
                      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const timeStr = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                      
                      moveToSchedule(task, timeStr, false);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 1.1, cursor: 'grabbing', zIndex: 1000 }}
                  className={cn(
                    "flex-shrink-0 w-48 p-4 rounded-3xl border border-border snap-start transition-all duration-300 cursor-grab active:cursor-grabbing active:shadow-2xl active:z-[1000]",
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
                  <div className="mt-2 text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest">Drag to schedule ↓</div>
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold tracking-tight text-primary">Your Schedule</h2>
          </div>
          <button 
            onClick={addTimeblock}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
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
                {scheduleTasks.map((block) => {
                  const minutesFrom8AM = timeToMinutes(block.time) - 8 * 60;
                  const topPosition = (minutesFrom8AM / interval) * rowHeight;
                  const currentDuration = resizingTask?.id === block.id ? resizingTask.duration : (block.duration || 30);
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
                        zIndex: resizingTask?.id === block.id ? 50 : 10
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => !resizingTask && setEditingTask(block)}
                      drag={resizingTask?.id === block.id ? false : "y"}
                      dragConstraints={scheduleRef}
                      dragElastic={0.05}
                      dragMomentum={false}
                      onDragStart={(e, info) => {
                        const target = e.currentTarget as HTMLElement;
                        if (!target) return;
                        const rect = target.getBoundingClientRect();
                        dragOffsetRef.current = info.point.y - rect.top;
                      }}
                      onDragEnd={(e, info) => {
                        const scheduleElement = scheduleRef.current;
                        if (!scheduleElement) return;
                        
                        const rect = scheduleElement.getBoundingClientRect();
                        const y = info.point.y;
                        
                        // Calculate relative Y within the scrollable area
                        const relativeY = y - rect.top + scheduleElement.scrollTop;
                        
                        // Snap to interval (e.g., 30 or 15 mins) for better alignment with lines
                        const pixelsPerMinute = rowHeight / interval;
                        const totalMinutes = Math.round(relativeY / (pixelsPerMinute * interval)) * interval;
                        
                        const hour = Math.floor(totalMinutes / 60) + 8;
                        const minutes = totalMinutes % 60;
                        
                        // Clamp between 8 AM and 10 PM
                        const clampedHour = Math.max(8, Math.min(22, hour));
                        
                        const displayHour = clampedHour > 12 ? clampedHour - 12 : (clampedHour === 0 ? 12 : clampedHour);
                        const ampm = clampedHour >= 12 ? 'PM' : 'AM';
                        const timeStr = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                        
                        updateTask(block.id, { time: timeStr });
                      }}
                      style={{ 
                        position: 'absolute',
                        left: '80px',
                        right: '16px',
                        top: topPosition,
                        height: height,
                        backgroundColor: block.color?.startsWith('#') ? block.color : undefined 
                      }}
                      className={cn(
                        "group flex flex-col p-3 rounded-2xl border border-white/10 backdrop-blur-sm hover:brightness-110 transition-all duration-300 cursor-grab active:cursor-grabbing overflow-hidden shadow-lg",
                        (!block.color || !block.color.startsWith('#')) && (block.color || 'bg-moss/80'),
                        block.completed && "opacity-50"
                      )}
                    >
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase",
                              ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white/80" : "text-black/60"
                            )}>
                              {block.time || '09:00 am'} {currentDuration ? `• ${currentDuration}m` : ''}
                            </span>
                          </div>
                          <GripVertical className={cn(
                            "w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity",
                            ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white/40" : "text-black/30"
                          )} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "font-bold text-xs truncate",
                            ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white" : "text-black/80"
                          )}>{block.title}</p>
                          {block.subtasks && block.subtasks.length > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest",
                              ['#95714F', '#8C916C', '#4A3728', '#A69076', '#7D8461', '#C7AF94', '#9E9E8C'].includes(block.color || '') ? "text-white/60" : "text-black/40"
                            )}>
                              <ListTodo className="w-2 h-2" />
                              {block.subtasks.filter(s => s.completed).length}/{block.subtasks.length}
                            </div>
                          )}
                        </div>
                      </div>
  
                      {/* Resize Handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center group-hover:bg-black/5 transition-colors z-20"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startY = e.clientY;
                          const startDuration = block.duration || 30;
                          
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const deltaY = moveEvent.clientY - startY;
                            const pixelsPerMinute = rowHeight / interval;
                            const deltaMinutes = Math.round(deltaY / (pixelsPerMinute * (interval / 2))) * (interval / 2);
                            const newDuration = Math.max(interval, startDuration + deltaMinutes);
                            setResizingTask({ id: block.id, duration: newDuration });
                          };
                          
                          const onMouseUp = (upEvent: MouseEvent) => {
                            const deltaY = upEvent.clientY - startY;
                            const pixelsPerMinute = rowHeight / interval;
                            const deltaMinutes = Math.round(deltaY / (pixelsPerMinute * interval)) * interval;
                            const newDuration = Math.max(interval, startDuration + deltaMinutes);
                            updateTask(block.id, { duration: newDuration });
                            setResizingTask(null);
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                          };
                          
                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          const startY = e.touches[0].clientY;
                          const startDuration = block.duration || 30;
                          
                          const onTouchMove = (moveEvent: TouchEvent) => {
                            const deltaY = moveEvent.touches[0].clientY - startY;
                            const pixelsPerMinute = rowHeight / interval;
                            const deltaMinutes = Math.round(deltaY / (pixelsPerMinute * (interval / 2))) * (interval / 2);
                            const newDuration = Math.max(interval, startDuration + deltaMinutes);
                            setResizingTask({ id: block.id, duration: newDuration });
                          };
                          
                          const onTouchEnd = (upEvent: TouchEvent) => {
                            const deltaY = upEvent.changedTouches[0].clientY - startY;
                            const pixelsPerMinute = rowHeight / interval;
                            const deltaMinutes = Math.round(deltaY / (pixelsPerMinute * interval)) * interval;
                            const newDuration = Math.max(interval, startDuration + deltaMinutes);
                            updateTask(block.id, { duration: newDuration });
                            setResizingTask(null);
                            document.removeEventListener('touchmove', onTouchMove);
                            document.removeEventListener('touchend', onTouchEnd);
                          };
                          
                          document.addEventListener('touchmove', onTouchMove);
                          document.addEventListener('touchend', onTouchEnd);
                        }}
                      >
                        <div className="w-8 h-1 bg-black/20 rounded-full" />
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
            
            {scheduleTasks.length === 0 && (
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
