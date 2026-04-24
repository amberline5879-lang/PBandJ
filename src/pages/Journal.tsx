import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, MessageSquare, Plus, Trash2, ChevronRight, ChevronLeft, Calendar, Send, History, Mic, MicOff, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { PROMPTS } from '../constants';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { JournalEntry } from '../types';
import { format } from 'date-fns';

const Journal: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'gratitude' | 'prompts' | 'moments' | 'dump'>('gratitude');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [dumpEntry, setDumpEntry] = useState('');
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const unsub = storage.subscribe(storage.key.JOURNAL_ENTRIES, (data) => {
      const journalData = (data as JournalEntry[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(journalData);
    });
    return () => unsub();
  }, []);

  const addEntry = async (type: 'gratitude' | 'prompts' | 'moments' | 'dump', content: string) => {
    if (!content.trim()) return;
    try {
      await storage.add(storage.key.JOURNAL_ENTRIES, {
        uid: user?.uid || 'guest',
        type,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        ...(type === 'prompts' ? { prompt: PROMPTS[currentPromptIdx].text } : {})
      });
      if (type === 'gratitude') setNewEntry('');
      if (type === 'moments') setNewEntry('');
      if (type === 'prompts') setNewEntry('');
      if (type === 'dump') setDumpEntry('');
    } catch (error) {
      console.error('Error adding journal entry:', error);
    }
  };

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      // @ts-ignore
      window.recognition?.stop();
    } else {
      setIsRecording(true);
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setDumpEntry(prev => prev + ' ' + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      // @ts-ignore
      window.recognition = recognition;
      recognition.start();
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await storage.delete(storage.key.JOURNAL_ENTRIES, id);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  const gratitudeEntries = entries.filter(e => e.type === 'gratitude');
  const promptEntries = entries.filter(e => e.type === 'prompts');
  const momentEntries = entries.filter(e => e.type === 'moments');
  const dumpEntries = entries.filter(e => e.type === 'dump');

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Gratitude Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Gratitude</h2>
        </div>
        
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {gratitudeEntries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-primary border border-secondary text-sm font-medium text-primary-foreground flex justify-between items-center group"
              >
                <span>{entry.content}</span>
                <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={activeSection === 'gratitude' ? newEntry : ''}
              onChange={(e) => { setActiveSection('gratitude'); setNewEntry(e.target.value); }}
              placeholder="What are you thankful for?"
              className="flex-1 p-4 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-all"
              onKeyDown={(e) => e.key === 'Enter' && addEntry('gratitude', newEntry)}
            />
            <button
              onClick={() => addEntry('gratitude', newEntry)}
              className="p-4 rounded-2xl bg-secondary text-secondary-foreground hover:opacity-90 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Daily Prompt Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-secondary text-secondary-foreground">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Daily Prompt</h2>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-secondary to-secondary/80 border border-border shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">{PROMPTS[currentPromptIdx].category}</span>
            <button onClick={() => setCurrentPromptIdx((prev) => (prev + 1) % PROMPTS.length)} className="p-2 rounded-full hover:bg-white/10 transition-all text-secondary-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold tracking-tight text-secondary-foreground leading-tight">
            {PROMPTS[currentPromptIdx].text}
          </h3>

          <div className="relative">
            <textarea
              value={activeSection === 'prompts' ? newEntry : ''}
              onChange={(e) => { setActiveSection('prompts'); setNewEntry(e.target.value); }}
              placeholder="Type your reflection here..."
              className="w-full min-h-[120px] p-4 rounded-2xl bg-background/50 border border-border text-sm focus:outline-none focus:border-primary transition-all resize-none"
            />
            <button 
              onClick={() => addEntry('prompts', newEntry)}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Good Moments Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-accent text-accent-foreground">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Good Moments</h2>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {momentEntries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-accent border border-secondary text-sm font-medium text-accent-foreground flex justify-between items-center group"
              >
                <span>{entry.content}</span>
                <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={activeSection === 'moments' ? newEntry : ''}
              onChange={(e) => { setActiveSection('moments'); setNewEntry(e.target.value); }}
              placeholder="A small win from today?"
              className="flex-1 p-4 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:border-accent transition-all"
              onKeyDown={(e) => e.key === 'Enter' && addEntry('moments', newEntry)}
            />
            <button
              onClick={() => addEntry('moments', newEntry)}
              className="p-4 rounded-2xl bg-accent text-accent-foreground hover:opacity-90 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* End of Day Dump Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <Moon className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">End of Day Dump</h2>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-4">
          <div className="relative">
            <textarea
              value={dumpEntry}
              onChange={(e) => setDumpEntry(e.target.value)}
              placeholder="Dump all your thoughts here... How was your day? What's on your mind?"
              className="w-full min-h-[200px] p-4 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all resize-none"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={toggleRecording}
                className={cn(
                  "p-3 rounded-full transition-all shadow-lg",
                  isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                title={isRecording ? "Stop Recording" : "Start Voice-to-Text"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => addEntry('dump', dumpEntry)}
                className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Dumps</h4>
            <div className="space-y-2">
              {dumpEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="p-3 rounded-xl bg-background border border-border text-xs text-muted-foreground flex justify-between items-start group">
                  <p className="line-clamp-2 flex-1">{entry.content}</p>
                  <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Journal;
