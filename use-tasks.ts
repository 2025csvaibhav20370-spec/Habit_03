import { useLocalStorage } from "./use-local-storage";
import { useAuth } from "./use-auth";
import { useMemo } from "react";

export type Priority = "Low" | "Medium" | "High";
export type Category = "Work" | "Personal" | "Health" | "Study" | "Other";

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  category: Category;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  notes?: string;
}

export function useTasks() {
  const { user } = useAuth();
  // Store all tasks in a single object keyed by username
  const [allTasks, setAllTasks] = useLocalStorage<Record<string, Task[]>>("prod_tracker_tasks", {});

  const userTasks = useMemo(() => {
    if (!user) return [];
    return allTasks[user.username] || [];
  }, [allTasks, user]);

  const saveUserTasks = (tasks: Task[]) => {
    if (!user) return;
    setAllTasks(prev => ({
      ...prev,
      [user.username]: tasks
    }));
  };

  const addTask = (
    title: string, 
    priority: Priority, 
    category: Category = "Other",
    dueDate?: string,
    notes?: string
  ) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      priority,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate,
      notes,
    };
    saveUserTasks([newTask, ...userTasks]);
  };

  const toggleTask = (id: string) => {
    saveUserTasks(
      userTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const deleteTask = (id: string) => {
    saveUserTasks(userTasks.filter(t => t.id !== id));
  };
  
  const clearCompleted = () => {
    saveUserTasks(userTasks.filter(t => !t.completed));
  };

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return userTasks.filter(t => 
      t.completed && t.createdAt.startsWith(today)
    ).length;
  }, [userTasks]);

  const pendingToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return userTasks.filter(t => 
      !t.completed && t.createdAt.startsWith(today)
    ).length;
  }, [userTasks]);

  return {
    tasks: userTasks,
    addTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    stats: {
      completedToday,
      pendingToday,
      totalToday: completedToday + pendingToday,
      totalTasks: userTasks.length,
      totalCompleted: userTasks.filter(t => t.completed).length,
      totalPending: userTasks.filter(t => !t.completed).length,
    }
  };
}
