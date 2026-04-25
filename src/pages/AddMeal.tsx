import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Plus, Search, HelpCircle, Edit3, CheckCircle2, ArrowRight, Camera, X } from 'lucide-react';
import { cn, compressImage } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { storage } from '../lib/storage';
import { Meal, Recipe } from '../types';

const AddMeal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [mode, setMode] = useState<'selection' | 'manual'>('selection');
  const [mealType, setMealType] = useState<string>(searchParams.get('type') || 'breakfast');
  const [date, setDate] = useState<string>(searchParams.get('date') || new Date().toISOString());
  
  // Search and Link state
  const [searchQuery, setSearchQuery] = useState('');
  const [recipeLink, setRecipeLink] = useState('');
  const [isLinkAnalyzed, setIsLinkAnalyzed] = useState(false);

  // Manual Entry State
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Recent Meals State
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    fetchRecentMeals();
    fetchSavedRecipes();
  }, []);

  const fetchRecentMeals = async () => {
    setLoadingRecent(true);
    try {
      const allMeals = await storage.getAll<Meal>(storage.key.MEALS);
      setRecentMeals(allMeals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent meals:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchSavedRecipes = async () => {
    try {
      const allRecipes = await storage.getAll<Recipe>(storage.key.RECIPES);
      setSavedRecipes(allRecipes);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
    }
  };

  const handleAddIngredient = () => setIngredients([...ingredients, '']);
  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setPhoto(compressed);
        } catch (error) {
          console.error('Error compressing image:', error);
          setPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (saveToRecipes: boolean) => {
    const mealData = {
      name,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      ingredients: ingredients.filter(i => i.trim() !== ''),
      instructions,
      prepTime,
      cookTime,
      photo: photo || undefined,
      uid: user?.uid || 'guest',
      date,
      type: mealType,
      saveToRecipes
    };

    console.log('Attempting to save meal to session storage:', mealData.name);
    
    try {
      // Store in session storage to pass to the assignment page
      sessionStorage.setItem('pendingMeal', JSON.stringify(mealData));
      console.log('Successfully saved to session storage');
      setShowSaveModal(false);
      navigate('/assign-meal');
    } catch (error) {
      console.error('Error saving to session storage:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('Data is too large (likely the photo). Please try without the photo or use a smaller one.');
      } else {
        alert('An error occurred. Please try again.');
      }
    }
  };

  const handleAddLink = () => {
    if (!recipeLink.trim()) return;
    // Mock analysis
    setIsLinkAnalyzed(true);
    setTimeout(() => {
      // In a real app, this would trigger AI analysis
      setName("Analyzed Recipe from Link");
      setMode('manual');
    }, 1500);
  };

  const handleQuickAdd = (meal: Meal) => {
    const mealData = {
      ...meal,
      uid: user?.uid || 'guest',
      date,
      type: mealType,
      saveToRecipes: false
    };

    sessionStorage.setItem('pendingMeal', JSON.stringify(mealData));
    navigate('/assign-meal');
  };

  const renderSelection = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for recipes..."
          className="w-full pl-12 pr-4 py-4 rounded-full bg-muted/50 border-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>

      {/* Paste Link Section */}
      <div className="space-y-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={recipeLink}
            onChange={(e) => setRecipeLink(e.target.value)}
            placeholder="Paste recipe link"
            className="w-full pl-6 pr-24 py-4 rounded-full bg-secondary/20 border-secondary/30 border focus:ring-2 focus:ring-secondary/40 text-sm"
          />
          <button
            onClick={handleAddLink}
            className="absolute right-2 px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        {isLinkAnalyzed && (
          <div className="flex items-center gap-2 px-4 text-[10px] font-bold text-primary animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-3 h-3" />
            Recipe analyzed successfully
          </div>
        )}
      </div>

      {/* Manual Entry Card */}
      <button
        onClick={() => setMode('manual')}
        className="w-full p-6 rounded-[2.5rem] bg-lavender/20 border border-lavender/30 shadow-sm hover:shadow-md transition-all flex items-center gap-6 text-left group"
      >
        <div className="p-4 rounded-full bg-lavender/30 text-lavender-foreground">
          <Edit3 className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">Manual Entry</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-black uppercase tracking-wider">AI POPULATING...</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">Identifying ingredients and cooking time...</p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Saved Meals Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-lg font-bold text-foreground">Saved Recipes</h2>
          <button 
            onClick={() => navigate('/recipes')}
            className="text-xs font-bold text-primary hover:underline"
          >
            See all
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {savedRecipes.length > 0 ? (
            savedRecipes.map((meal, idx) => (
              <button 
                key={meal.id} 
                onClick={() => handleQuickAdd(meal as unknown as Meal)}
                className={cn(
                  "min-w-[160px] rounded-[2rem] overflow-hidden shadow-sm border transition-all hover:scale-105 text-left",
                  idx % 3 === 0 ? "bg-moss/20 border-moss/30" : idx % 3 === 1 ? "bg-rose/20 border-rose/30" : "bg-sky/20 border-sky/30"
                )}
              >
                <img 
                  src={meal.photo || `https://picsum.photos/seed/${meal.name}/300/300`} 
                  alt={meal.name} 
                  className="w-full h-32 object-cover" 
                  referrerPolicy="no-referrer" 
                />
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-bold text-foreground leading-tight truncate">{meal.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{meal.prepTime || '15 min prep'}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="flex-1 text-center py-6 border-2 border-dashed border-border rounded-3xl text-[10px] uppercase font-bold text-muted-foreground/40">
              No saved recipes yet
            </div>
          )}
        </div>
      </section>

      {/* Recent Meals Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground px-2">Recent Meals</h2>
        <div className="space-y-3">
          {recentMeals.length > 0 ? (
            recentMeals.map((meal, idx) => (
              <div key={meal.id} className={cn(
                "p-5 rounded-[2.5rem] border shadow-sm flex items-center gap-4 group transition-all hover:shadow-md",
                idx % 4 === 0 ? "bg-moss/20 border-moss/30" : idx % 4 === 1 ? "bg-rose/20 border-rose/30" : idx % 4 === 2 ? "bg-sky/20 border-sky/30" : "bg-lavender/20 border-lavender/30"
              )}>
                <img 
                  src={`https://picsum.photos/seed/${meal.name}/100/100`} 
                  alt={meal.name} 
                  className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-foreground truncate">{meal.name}</h4>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">YESTERDAY</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {meal.calories ? `${meal.calories} kcal • ` : ''}{meal.protein ? `${meal.protein}g protein` : 'Quick meal'}
                  </p>
                </div>
                <button 
                  onClick={() => handleQuickAdd(meal)}
                  className="p-3 rounded-full bg-white/80 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 rounded-[2.5rem] bg-muted/30 border-2 border-dashed border-border text-muted-foreground text-xs italic">
              No recent meals yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderManual = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Meal Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Avocado Toast"
            className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Calories</label>
            <div className="relative">
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40 uppercase">kcal</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Protein</label>
            <div className="relative">
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40 uppercase">g</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Prep Time</label>
            <input
              type="text"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="e.g. 10 min"
              className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Cook Time</label>
            <input
              type="text"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="e.g. 15 min"
              className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <input
                key={index}
                type="text"
                value={ingredient}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                placeholder={`Ingredient ${index + 1}`}
                className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm"
              />
            ))}
            <button
              onClick={handleAddIngredient}
              className="flex items-center gap-2 text-[10px] font-bold text-primary p-2 hover:bg-primary/10 rounded-lg transition-all uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" />
              Add Ingredient
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="How to make it..."
            rows={4}
            className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Meal Photo</label>
          <div className="flex items-center gap-4">
            <label className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
              <Camera className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upload Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            {photo && (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border">
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowSaveModal(true)}
        disabled={!name.trim()}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
      >
        Save Meal
      </button>

      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl border border-border space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Save Meal</h3>
                <p className="text-sm text-muted-foreground">Where would you like to save this meal?</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleSave(true)}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Save to recipes & meal plan
                </button>
                <button
                  onClick={() => handleSave(false)}
                  className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all"
                >
                  Just save to meal plan
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="w-full py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => mode === 'selection' ? navigate(-1) : setMode('selection')}
          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-primary tracking-tight">
          {mode === 'selection' ? 'Add New Meal' : 'Manual Entry'}
        </h1>
        <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-8">
        {mode === 'selection' && renderSelection()}
        {mode === 'manual' && renderManual()}
      </div>
    </div>
  );
};

export default AddMeal;
