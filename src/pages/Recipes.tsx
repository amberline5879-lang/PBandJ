import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, ChevronRight, Clock, Utensils, Heart, Trash2, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Recipe } from '../types';
import { storage } from '../lib/storage';
import { useAuth } from '../components/AuthProvider';

const Recipes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const unsub = storage.subscribe(storage.key.RECIPES, (data) => {
      setRecipes(data as Recipe[]);
    });
    return () => unsub();
  }, []);

  const categories = ['All', ...Array.from(new Set(recipes.filter(r => r.category).map(r => r.category!)))];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this recipe?')) {
      await storage.delete(storage.key.RECIPES, id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-serif">Recipes</h1>
          <p className="text-sm text-muted-foreground italic">Nurturing your body, one meal at a time.</p>
        </div>
        <button 
          onClick={() => navigate('/add-recipe')}
          className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search recipes or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-card border border-border focus:outline-none focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe) => (
            <motion.div
              layout
              key={recipe.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Link 
                to={`/meal/${recipe.id}?source=recipe`} 
                className="group block p-6 rounded-[2rem] bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
              >
                {recipe.photo && (
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8 rotate-12 transition-transform group-hover:scale-110">
                    <img src={recipe.photo} alt="" className="w-full h-full object-cover rounded-full" />
                  </div>
                )}
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{recipe.category || 'Recipe'}</span>
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{recipe.name}</h3>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(recipe.id, e)}
                      className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground font-medium">
                    {recipe.prepTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{recipe.prepTime} prep</span>
                      </div>
                    )}
                    {recipe.cookTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{recipe.cookTime} cook</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {recipe.ingredients.slice(0, 3).map((ing, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {ing}
                      </span>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <span className="px-2 py-1 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        +{recipe.ingredients.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredRecipes.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="inline-flex p-6 rounded-full bg-muted text-muted-foreground/30">
            <Utensils className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">No recipes found</h3>
            <p className="text-sm text-muted-foreground">Try a different search or add a new recipe.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
