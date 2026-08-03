import { Task, Routine, Challenge, ActiveChallenge, Meal, Workout, SleepLog, ActivityLog, JournalEntry, UserSettings } from '../types';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';

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
  JOURNALS: 'serene_journals',
  SETTINGS: 'serene_settings',
  RECIPES: 'serene_recipes',
  LISTS: 'serene_lists',
  CYCLE_ENTRIES: 'serene_cycle_entries',
  MOOD_ENTRIES: 'serene_mood_entries',
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
      window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
  }

  // Generic CRUD
  async getAll<T>(key: string): Promise<T[]> {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid !== 'local-user' && !currentUser.uid.startsWith('guest-')) {
      try {
        const q = query(collection(db, key), where('uid', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      } catch (error) {
        console.warn(`Firestore getAll failed for key ${key}, falling back to localStorage:`, error);
      }
    }
    return this.get<T>(key);
  }

  async update(key: string, id: string, updates: any): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid !== 'local-user' && !currentUser.uid.startsWith('guest-')) {
      try {
        const docRef = doc(db, key, id);
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        await setDoc(docRef, { ...existingData, ...updates, id, uid: currentUser.uid });
        return;
      } catch (error) {
        console.warn(`Firestore update failed for key ${key} and id ${id}, falling back to localStorage:`, error);
      }
    }

    // Local Storage Fallback
    const items = this.get<any>(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(key, items);
    }
  }

  async add(key: string, item: any): Promise<string> {
    const id = this.generateId();
    const newItem = { ...item, id };
    const currentUser = auth.currentUser;
    
    if (currentUser && currentUser.uid !== 'local-user' && !currentUser.uid.startsWith('guest-')) {
      newItem.uid = currentUser.uid;
      try {
        const docRef = doc(db, key, id);
        await setDoc(docRef, newItem);
        return id;
      } catch (error) {
        console.warn(`Firestore add failed for key ${key}, falling back to localStorage:`, error);
      }
    }

    // Local Storage Fallback
    const items = this.get<any>(key);
    items.push(newItem);
    this.set(key, items);
    return id;
  }

  async delete(key: string, id: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid !== 'local-user' && !currentUser.uid.startsWith('guest-')) {
      try {
        const docRef = doc(db, key, id);
        await deleteDoc(docRef);
        return;
      } catch (error) {
        console.warn(`Firestore delete failed for key ${key} and id ${id}, falling back to localStorage:`, error);
      }
    }

    // Local Storage Fallback
    const items = this.get<any>(key);
    const filtered = items.filter((item: any) => item.id !== id);
    this.set(key, filtered);
  }

  async getById<T extends { id: string }>(key: string, id: string): Promise<T | null> {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid !== 'local-user' && !currentUser.uid.startsWith('guest-')) {
      try {
        const docRef = doc(db, key, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().uid === currentUser.uid) {
          return { id: docSnap.id, ...docSnap.data() } as T;
        }
        return null;
      } catch (error) {
        console.warn(`Firestore getById failed for key ${key} and id ${id}, falling back to localStorage:`, error);
      }
    }
    const items = this.get<T>(key);
    return items.find(item => item.id === id) || null;
  }

  // Subscription helpers
  subscribe(key: string, callback: (data: any[]) => void, uid?: string): () => void {
    const userId = uid || auth.currentUser?.uid;
    let unsubscribeFirestore: (() => void) | null = null;

    if (userId && userId !== 'local-user' && !userId.startsWith('guest-')) {
      try {
        const q = query(collection(db, key), where('uid', '==', userId));
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(items);
        }, (error) => {
          console.warn(`Firestore onSnapshot error for key ${key}, falling back to local events:`, error);
          callback(this.get(key));
        });
      } catch (err) {
        console.error(`Firestore snapshot subscription setup failed for key ${key}:`, err);
        callback(this.get(key));
      }
    } else {
      callback(this.get(key));
    }

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
    
    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener('storage-update', localHandler as EventListener);
      window.removeEventListener('storage', crossTabHandler);
    };
  }

  get key() { return STORAGE_KEYS; }
}

export const storage = new StorageService();
export default storage;
