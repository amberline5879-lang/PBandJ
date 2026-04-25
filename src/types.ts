export type ThemeType = 'pastel' | 'vibrant' | 'green' | 'blue' | 'dark' | 'vibrate' | 'earthy';
export type FontSizeType = 'small' | 'medium' | 'large';
export type FontType = 'standard';

export type ScheduleIntervalType = 60 | 30 | 15 | 10 | 5;

export interface UserSettings {
  theme: ThemeType;
  fontSize: FontSizeType;
  fontType: FontType;
  scheduleInterval: ScheduleIntervalType;
  showCycleTracking: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  settings: UserSettings;
}

export interface Task {
  id: string;
  uid: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // ISO 8601 date string
  timeSlot?: string;
  listId?: string;
  order: number;
  type?: 'todo' | 'timeblock';
  time?: string;
  color?: string;
  duration?: number; // in minutes
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface RoutineStep {
  id: string;
  title: string;
  subtitle?: string;
  duration?: number; // in seconds
  completed: boolean;
  icon?: string;
}

export interface Routine {
  id: string;
  uid: string;
  name: string;
  type: 'morning' | 'night' | 'custom';
  steps: RoutineStep[];
  order?: number;
  createdAt?: string;
}

export interface ChallengeDay {
  dayNumber: number;
  task: string;
}

export interface Challenge {
  id: string;
  uid?: string;
  challengeId?: string;
  title: string;
  description: string;
  days: ChallengeDay[];
  startDate?: string;
  completedDays?: number[];
  active?: boolean;
}

export interface ActiveChallenge {
  id: string;
  uid: string;
  challengeId: string;
  startDate: string; // ISO 8601 date string
  currentDay: number;
  completedDays: number[];
}

export interface Meal {
  id: string;
  uid: string;
  date: string; // ISO 8601 date string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  recipe?: string;
  link?: string;
  calories?: number;
  protein?: number;
  ingredients?: string[];
  instructions?: string;
  prepTime?: string;
  cookTime?: string;
  photo?: string;
}

export interface Recipe {
  id: string;
  uid: string;
  name: string;
  category?: string;
  ingredients: string[];
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  calories?: number;
  photo?: string;
  tags?: string[];
  createdAt?: string;
}

export interface Exercise {
  name: string;
  sets?: string;
  reps?: string;
  weight?: string;
}

export interface Workout {
  id: string;
  uid: string;
  date: string; // ISO 8601 date string
  name: string;
  duration?: string;
  type?: string;
  details?: string;
  link?: string;
  exercises?: Exercise[];
  calories?: number;
  instructions?: string;
  photo?: string;
  createdAt?: string;
}

export interface SleepLog {
  id: string;
  uid: string;
  date: string; // ISO 8601 date string
  duration: string; // e.g. "7h 30m"
  quality: number; // 0-100
  notes?: string;
}

export interface ActivityLog {
  id: string;
  uid: string;
  date: string; // ISO 8601 date string
  steps?: number;
  activeMinutes?: number;
  distance?: string;
  calories?: number;
  activities?: { name: string; duration: string }[];
}

export interface JournalEntry {
  id: string;
  uid: string;
  date: string; // ISO 8601 date string
  type?: 'gratitude' | 'prompts' | 'moments' | 'dump';
  content?: string;
  gratitude?: string[];
  promptId?: string;
  promptResponse?: string;
  goodMoments?: string[];
  createdAt?: string;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export interface CycleEntry {
  id: string;
  uid: string;
  date: string;
  flow: 'none' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  mood?: string;
  moods?: string[];
  emotions?: string[];
  activities?: string[];
  updatedAt?: string;
}

export interface MoodEntry {
  id: string;
  uid: string;
  mood: string;
  intensity: number;
  factors: string[];
  note?: string;
  date: string;
  createdAt: string;
}
