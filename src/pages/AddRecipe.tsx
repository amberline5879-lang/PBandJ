import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Save, Plus, Trash2, Clock, Utensils, Tag } from 'lucide-react';
import { storage } from '../lib/storage';
import { Recipe } from '../types';
import { useAuth } from '../components/AuthProvider';

const AddRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [calories, setCalories] = useState('');
  const [servings, setServings] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredientTemp, setIngredientTemp] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [tagTemp, setTagTemp] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const addIngredient = () => {
    if (ingredientTemp.trim()) {
      setIngredients([...ingredients, ingredientTemp.trim()]);
      setIngredientTemp('');
    }
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    if (tagTemp.trim()) {
      setTags([...tags, tagTemp.trim()]);
      setTagTemp('');
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a recipe name.');
      return;
    }

    setLoading(true);
    try {
      const newRecipe: Partial<Recipe> = {
        uid: user?.uid || 'guest',
        name: name.trim(),
        category: category.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        calories: calories ? parseInt(calories) : undefined,
        servings: servings ? parseInt(servings) : undefined,
        instructions: instructions.trim(),
        ingredients,
        tags,
        createdAt: new Date().toISOString()
      };

      await storage.add(storage.key.RECIPES, newRecipe);
      navigate('/recipes');
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-primary">New Recipe</h1>
        <button 
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 px-4"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </header>

      <div className="space-y-6">
        <section className="space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-4">Recipe Info</label>
          <div className="bg-card rounded-[2.5rem] p-6 border border-border shadow-sm space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Recipe Name (e.g., Morning Glow Oatmeal)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Prep Time"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Cook Time"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
              />
              <input
                type="number"
                placeholder="Calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
              />
              <input
                type="number"
                placeholder="Servings"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-4">Ingredients</label>
          <div className="bg-card rounded-[2.5rem] p-6 border border-border shadow-sm space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add ingredient..."
                value={ingredientTemp}
                onChange={(e) => setIngredientTemp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                className="flex-1 p-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
              />
              <button 
                onClick={addIngredient}
                className="p-3 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {ingredients.map((ing, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border text-sm"
                  >
                    <span>{ing}</span>
                    <button onClick={() => removeIngredient(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-4">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step by step instructions..."
            className="w-full min-h-[200px] p-6 rounded-[2.5rem] bg-card border border-border text-sm focus:outline-none focus:border-primary transition-all resize-none shadow-sm"
          />
        </section>

        <section className="space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-4">Tags</label>
          <div className="bg-card rounded-[2.5rem] p-6 border border-border shadow-sm space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag (e.g., Vegan, Gluten-Free)..."
                value={tagTemp}
                onChange={(e) => setTagTemp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 p-3 rounded-2xl bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
              />
              <button 
                onClick={addTag}
                className="p-3 rounded-2xl bg-secondary text-secondary-foreground"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-tighter">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button onClick={() => removeTag(idx)} className="hover:text-primary/70">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-4 rounded-2xl bg-muted text-muted-foreground font-bold text-xs uppercase tracking-widest transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="flex-[2] py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    </div>
  );
};

export default AddRecipe;
