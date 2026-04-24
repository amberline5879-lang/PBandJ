import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, ChevronLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AICoach: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Serene Life Coach. How are you feeling today? Is there anything on your mind that we could explore together?" }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!userMessage.trim() || isLoading) return;

    const currentInput = userMessage.trim();
    setUserMessage('');
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          userMessage: currentInput,
          systemInstruction: "You are 'Serene', a highly empathetic, patient, and supportive life coach for a neurodivergent-friendly productivity app called 'PlanBelieve'. Your primary goal is to help users manage executive dysfunction, overwhelm, and sensory overload. \n\nGuidelines:\n1. Be gentle and validating. Acknowledge that tasks can be hard.\n2. Use structured advice: break things down into tiny, manageable steps.\n3. Celebrate 'small wins' enthusiastically.\n4. Avoid 'just do it' energy; instead, suggest 'body doubling', 'visual timers', or 'sensory check-ins'.\n5. Keep responses concise and scannable with bullet points if helpful.\n6. If the user feels overwhelmed, suggest a 2-minute grounding exercise or a simple brain dump."
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to AI server');
      }

      const data = await response.json();
      const aiText = data.text || "I'm sorry, I couldn't quite process that. Could you try again?";
      
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Coach Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting right now. Let's try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="p-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">AI Life Coach</h2>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-4 rounded-3xl text-sm shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-card border border-border rounded-tl-none"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-[85%] mr-auto"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
            <div className="p-4 rounded-3xl bg-card border border-border rounded-tl-none text-sm text-muted-foreground italic">
              Thinking...
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative mt-auto">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Share what's on your mind..."
          className="w-full p-4 pr-14 rounded-3xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-all shadow-sm"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!userMessage.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AICoach;
