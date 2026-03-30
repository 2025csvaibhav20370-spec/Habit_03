import { useLocalStorage } from "./use-local-storage";
import { useAuth } from "./use-auth";
import { useMemo } from "react";
import { format, subDays, isToday } from "date-fns";

export interface HabitItem {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
}

export interface HabitDay {
  habits: HabitItem[];
  savedAt: string;
}

const DEFAULT_HABITS: HabitItem[] = [
  { id: "study", name: "Study", emoji: "📚", completed: false },
  { id: "exercise", name: "Exercise", emoji: "🏋️", completed: false },
  { id: "reading", name: "Reading", emoji: "📖", completed: false },
  { id: "coding", name: "Coding", emoji: "💻", completed: false },
  { id: "meditation", name: "Meditation", emoji: "🧘", completed: false },
  { id: "hydration", name: "Hydration", emoji: "💧", completed: false },
];

export function useHabits() {
  const { user } = useAuth();
  // Keyed by username, then by date string 'YYYY-MM-DD'
  const [allHabits, setAllHabits] = useLocalStorage<Record<string, Record<string, HabitDay>>>("prod_tracker_habits_v2", {});
  // Store the list of active habits separately so when we add/delete it applies to future days
  const [userActiveHabits, setUserActiveHabits] = useLocalStorage<Record<string, Omit<HabitItem, 'completed'>[]>>("prod_tracker_active_habits", {});

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const activeHabitDefs = useMemo(() => {
    if (!user) return DEFAULT_HABITS.map(({id, name, emoji}) => ({id, name, emoji}));
    return userActiveHabits[user.username] || DEFAULT_HABITS.map(({id, name, emoji}) => ({id, name, emoji}));
  }, [user, userActiveHabits]);

  const userHabitsRecord = useMemo(() => {
    if (!user) return {};
    return allHabits[user.username] || {};
  }, [allHabits, user]);

  const todayHabits = useMemo(() => {
    const existing = userHabitsRecord[todayStr];
    if (existing) {
      // Merge existing habits with current active definitions (in case definitions changed)
      const mergedHabits = activeHabitDefs.map(def => {
        const found = existing.habits.find(h => h.id === def.id);
        return {
          id: def.id,
          name: def.name,
          emoji: def.emoji,
          completed: found ? found.completed : false
        };
      });
      return { habits: mergedHabits, savedAt: existing.savedAt };
    }
    return {
      habits: activeHabitDefs.map(def => ({ ...def, completed: false })),
      savedAt: new Date().toISOString(),
    };
  }, [userHabitsRecord, todayStr, activeHabitDefs]);

  const saveHabits = (habits: HabitItem[]) => {
    if (!user) return;
    const newRecord: HabitDay = {
      habits,
      savedAt: new Date().toISOString()
    };
    
    setAllHabits(prev => ({
      ...prev,
      [user.username]: {
        ...(prev[user.username] || {}),
        [todayStr]: newRecord
      }
    }));
  };
  
  const addHabitDef = (name: string, emoji: string) => {
    if (!user) return;
    const newDef = { id: crypto.randomUUID(), name, emoji };
    const newActive = [...activeHabitDefs, newDef];
    setUserActiveHabits(prev => ({ ...prev, [user.username]: newActive }));
    
    // Also update today's habits to include it immediately
    const updatedToday = [...todayHabits.habits, { ...newDef, completed: false }];
    saveHabits(updatedToday);
  };
  
  const removeHabitDef = (id: string) => {
    if (!user) return;
    const newActive = activeHabitDefs.filter(h => h.id !== id);
    setUserActiveHabits(prev => ({ ...prev, [user.username]: newActive }));
    
    // Update today's habits
    const updatedToday = todayHabits.habits.filter(h => h.id !== id);
    saveHabits(updatedToday);
  };

  const streak = useMemo(() => {
    let currentStreak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      const day = userHabitsRecord[dStr];
      
      if (day && day.habits.length > 0) {
        const completedCount = day.habits.filter(h => h.completed).length;
        const totalCount = day.habits.length;
        // At least 50% = streak
        if (completedCount / totalCount >= 0.5) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          // Break streak unless it's today
          if (currentStreak === 0 && isToday(checkDate)) {
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }
      } else {
        if (currentStreak === 0 && isToday(checkDate)) {
          checkDate = subDays(checkDate, 1);
        } else {
          break; // Streak broken
        }
      }
    }
    return currentStreak;
  }, [userHabitsRecord]);

  const last7DaysPerformance = useMemo(() => {
    const data = [];
    let maxHabitsInWeek = 4; // Default safe fallback
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = format(d, 'yyyy-MM-dd');
      const day = userHabitsRecord[dStr];
      let completedCount = 0;
      if (day) {
        completedCount = day.habits.filter(h => h.completed).length;
        maxHabitsInWeek = Math.max(maxHabitsInWeek, day.habits.length);
      }
      data.push({
        day: format(d, 'EEE'), // Mon, Tue, etc.
        completed: completedCount
      });
    }
    return { data, maxHabitsInWeek };
  }, [userHabitsRecord]);

  return {
    todayHabits,
    saveHabits,
    addHabitDef,
    removeHabitDef,
    streak,
    last7DaysPerformance
  };
}
