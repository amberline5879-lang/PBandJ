import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { Home, List, Calendar, Book, Settings, Timer, User, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: List, label: 'Lists', path: '/lists' },
    { icon: Sparkles, label: 'Coach', path: '/ai-coach' },
    { icon: Heart, label: 'Health', path: '/health' },
    { icon: Home, label: 'Today', path: '/' },
    { icon: Calendar, label: 'Plan', path: '/plan' },
    { icon: Book, label: 'Journal', path: '/journal' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  console.log("Layout rendering, path:", location.pathname);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background text-foreground relative pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-[100] bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-border">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-primary"></h1>
        </div>
        <div className="flex gap-3">
          <Link to="/routines" className="p-2 rounded-full hover:bg-muted transition-colors">
            <Timer className="w-5 h-5 text-primary" />
          </Link>
          <Link to="/settings" className="p-1 rounded-full hover:bg-muted transition-colors overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="text-[8px] text-muted-foreground/10 absolute top-0 left-0">Path: {location.pathname}</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/90 backdrop-blur-lg border-t border-border px-4 py-2 flex justify-around items-center z-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 relative",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* "You're doing enough" floating message - subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.4 }}
        className="text-center py-12 text-sm italic text-muted-foreground pointer-events-none"
      >
        You're doing enough.
      </motion.div>
    </div>
  );
};

export default Layout;
