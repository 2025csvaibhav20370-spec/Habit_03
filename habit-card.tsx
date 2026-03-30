import { useState, useEffect } from "react";
import { useHabits, HabitItem } from "@/hooks/use-habits";
import { Target, Trophy, Plus, X, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_OPTIONS = ["📚", "🏋️", "📖", "💻", "🧘", "💧", "🎵", "🎨", "🛏️", "🍎", "✍️", "🌱"];

export function HabitCard() {
  const { todayHabits, saveHabits, streak, addHabitDef, removeHabitDef } = useHabits();
  
  // Local state to manage checkbox toggles before saving
  const [habits, setHabits] = useState<HabitItem[]>(todayHabits.habits);
  const [isSaved, setIsSaved] = useState(false);
  
  // Add habit form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("🌱");

  // Sync if todayHabits changes (e.g. day rollover or new habit added)
  useEffect(() => {
    setHabits(todayHabits.habits);
  }, [todayHabits]);

  const handleSave = () => {
    saveHabits(habits);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  
  const handleToggle = (id: string, checked: boolean) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: checked } : h));
  };
  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabitDef(newHabitName.trim(), newHabitEmoji);
    setNewHabitName("");
    setShowAddForm(false);
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div id="habits" className="glass-card rounded-3xl p-6 flex flex-col h-[600px] md:h-[650px] relative overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-display font-bold">Daily Habits</h2>
          <p className="text-sm text-muted-foreground mt-1">Build consistency everyday</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold">
            <Flame className="w-4 h-4 fill-current" />
            <span>{streak} Day Streak!</span>
          </div>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-muted-foreground">Today's Progress</span>
          <span className="text-sm font-bold">{completedCount} / {totalCount}</span>
        </div>
        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => {
              const isChecked = habit.completed;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={habit.id}
                  className={cn(
                    "relative flex flex-col p-4 rounded-2xl border transition-all duration-300 group",
                    isChecked 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <button 
                    onClick={() => removeHabitDef(habit.id)}
                    className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Delete habit permanently"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  
                  <label className="cursor-pointer flex flex-col h-full z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-black/20 group-hover:scale-110 transition-transform">
                        {habit.emoji}
                      </div>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggle(habit.id, e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className={cn(
                          "w-6 h-6 rounded-md border-2 transition-colors flex items-center justify-center mt-1 mr-1",
                          isChecked ? "bg-primary border-primary text-primary-foreground" : "border-white/20 bg-black/20"
                        )}>
                          <motion.div
                            initial={false}
                            animate={{ scale: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    <span className={cn("font-medium mt-auto", isChecked ? "text-primary" : "text-foreground")}>
                      {habit.name}
                    </span>
                  </label>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          <motion.button
            layout
            onClick={() => setShowAddForm(true)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/20 bg-transparent hover:bg-white/5 hover:border-white/30 transition-all text-muted-foreground hover:text-foreground h-full min-h-[100px]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Add Habit</span>
          </motion.button>
        </div>
      </div>

      {showAddForm && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm glass-card border border-white/10 rounded-2xl p-5 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">New Custom Habit</h3>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Habit Name</label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="E.g., Drink 2L Water"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Choose Emoji</label>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewHabitEmoji(emoji)}
                      className={cn(
                        "text-xl p-2 rounded-xl flex items-center justify-center transition-all hover:scale-110",
                        newHabitEmoji === emoji ? "bg-primary/20 border border-primary/50" : "bg-black/20 border border-transparent"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!newHabitName.trim()}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-2.5 rounded-xl font-medium shadow-lg hover:shadow-primary/40 transition-all disabled:opacity-50"
              >
                Add Habit
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="pt-4 mt-auto border-t border-white/10 relative z-10">
        <button
          onClick={handleSave}
          className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
        >
          {isSaved ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Progress Saved!</span>
            </motion.div>
          ) : (
            <>
              <span>Save Today's Progress</span>
              <Target className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Check(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 6 9 17l-5-5"/></svg>
}
