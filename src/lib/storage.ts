
import { Task, Routine, Challenge, ActiveChallenge, Meal, Workout, SleepLog, ActivityLog, JournalEntry, UserSettings } from '../types';

const STORAGE_KEYS = {
  TASKS: 'serene_tasks',
  ROUTINES: 'serene_routines',
  CHALLENGES: 'serene_challenges',
  ACTIVE_CHALLENGES: 'serene_active_challenges',
  MEALS: 'serene_meals',
  WORKOUTS: 'serene_workouts',
  SLEEP_LOGS: 'serene_sleep_logs',
  ACTIVITY_LOGS: 'serene_activity_logs',
  JOURNAL_ENTRIES: 'serene_journal_entries',
  SETTINGS: 'serene_settings',
  RECIPES: 'serene_recipes',
  LISTS: 'serene_lists',
  CYCLE_ENTRIES: 'serene_cycle_entries',
  MOODS: 'serene_moods',
};

class StorageService {
  private get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Dispatch a custom event to notify other components of changes
      window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        alert('Storage is full! Please delete some old entries to save new ones.');
      } else {
        alert('Failed to save data. Please check if your browser allows local storage.');
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Generic CRUD
  async getAll<T>(key: string): Promise<T[]> {
    return this.get<T>(key);
  }

  async update(key: string, id: string, updates: any): Promise<void> {
    const items = this.get<any>(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(key, items);
    }
  }

  async add(key: string, item: any): Promise<string> {
    const items = this.get<any>(key);
    const id = this.generateId();
    const newItem = { ...item, id };
    items.push(newItem);
    this.set(key, items);
    return id;
  }

  async delete(key: string, id: string): Promise<void> {
    const items = this.get<any>(key);
    const filtered = items.filter((item: any) => item.id !== id);
    this.set(key, filtered);
  }

  async getById<T extends { id: string }>(key: string, id: string): Promise<T | null> {
    const items = this.get<T>(key);
    return items.find(item => item.id === id) || null;
  }

  // Data Management
  async exportAll(): Promise<string> {
    const allData: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      allData[key] = this.get(key);
    });
    return JSON.stringify(allData, null, 2);
  }

  async importAll(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      Object.values(STORAGE_KEYS).forEach(key => {
        if (Array.isArray(data[key])) {
          this.set(key, data[key]);
        }
      });
    } catch (e) {
      console.error('Error importing data:', e);
      throw new Error('Invalid backup file');
    }
  }

  // Subscription-like helper
  subscribe(key: string, callback: (data: any[]) => void): () => void {
    const localHandler = (event: any) => {
      if (event.detail.key === key) {
        callback(this.get(key));
      }
    };
    
    const crossTabHandler = (event: StorageEvent) => {
      if (event.key === key) {
        callback(this.get(key));
      }
    };

    window.addEventListener('storage-update', localHandler as EventListener);
    window.addEventListener('storage', crossTabHandler);
    
    // Initial call
    callback(this.get(key));
    
    return () => {
      window.removeEventListener('storage-update', localHandler as EventListener);
      window.removeEventListener('storage', crossTabHandler);
    };
  }

  // Specific helpers to avoid using strings everywhere
  get key() { return STORAGE_KEYS; }
}

export const storage = new StorageService();
