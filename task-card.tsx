import { useState, useMemo } from "react";
import { useTasks, Priority, Category, Task } from "@/hooks/use-tasks";
import { Plus, Check, Trash2, Circle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, isBefore, startOfDay, parseISO } from "date-fns";

type FilterTab = "All" | "Pending" | "Completed" | "High";

export function TaskCard() {
  const { tasks, addTask, toggleTask, deleteTask, clearCompleted } = useTasks();
  
  // Form State
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [category, setCategory] = useState<Category>("Other");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showMoreOpts, setShowMoreOpts] = useState(false);
  
  // Filter State
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    addTask(
      title.trim(), 
      priority, 
      category, 
      dueDate ? new Date(dueDate).toISOString() : undefined,
      notes.trim() || undefined
    );
    
    // Reset form
    setTitle("");
    setPriority("Medium");
    setCategory("Other");
    setDueDate("");
    setNotes("");
    setShowMoreOpts(false);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // Category filter
    if (activeCategory !== "All") {
      result = result.filter(t => t.category === activeCategory);
    }
    
    // Tab filter
    switch (activeTab) {
      case "Pending":
        result = result.filter(t => !t.completed);
        break;
      case "Completed":
        result = result.filter(t => t.completed);
        break;
      case "High":
        result = result.filter(t => t.priority === "High" && !t.completed);
        break;
      case "All":
      default:
        break;
    }
    
    return result;
  }, [tasks, activeTab, activeCategory]);

  const priorityColors = {
    High: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    Low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };
  
  const categoryColors = {
    Work: "text-blue-400 border-blue-400/20 bg-blue-400/10",
    Personal: "text-purple-400 border-purple-400/20 bg-purple-400/10",
    Health: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
    Study: "text-amber-400 border-amber-400/20 bg-amber-400/10",
    Other: "text-gray-400 border-gray-400/20 bg-gray-400/10",
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false;
    const due = startOfDay(parseISO(task.dueDate));
    const today = startOfDay(new Date());
    return isBefore(due, today);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    return format(parseISO(isoString), "EEE, MMM d");
  };

  return (
    <div id="tasks" className="glass-card rounded-3xl p-6 flex flex-col h-[600px] md:h-[650px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-display font-bold">Tasks</h2>
        <div className="flex items-center gap-2">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
          >
            <option value="All">All Categories</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Health">Health</option>
            <option value="Study">Study</option>
            <option value="Other">Other</option>
          </select>
          {tasks.some(t => t.completed) && (
            <button 
              onClick={clearCompleted}
              className="px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
            >
              Clear Completed
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
        {(["All", "Pending", "Completed", "High"] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeTab === tab 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6 relative z-10 bg-white/5 border border-white/10 p-3 rounded-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 appearance-none min-w-[90px] cursor-pointer"
          >
            <option value="High" className="bg-background text-rose-400">High</option>
            <option value="Medium" className="bg-background text-amber-400">Medium</option>
            <option value="Low" className="bg-background text-emerald-400">Low</option>
          </select>
          <button
            type="submit"
            disabled={!title.trim()}
            className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <AnimatePresence>
          {showMoreOpts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-2 overflow-hidden pt-2"
            >
              <div className="flex gap-2 flex-wrap">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 cursor-pointer flex-1 min-w-[120px]"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Health">Health</option>
                  <option value="Study">Study</option>
                  <option value="Other">Other</option>
                </select>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 text-muted-foreground flex-1 min-w-[120px]"
                />
              </div>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 resize-none w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          type="button"
          onClick={() => setShowMoreOpts(!showMoreOpts)}
          className="text-xs text-muted-foreground/70 hover:text-primary flex items-center gap-1 self-center mt-1 transition-colors"
        >
          {showMoreOpts ? (
            <><ChevronUp className="w-3 h-3"/> Less options</>
          ) : (
            <><ChevronDown className="w-3 h-3"/> More options</>
          )}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-full flex flex-col items-center justify-center text-muted-foreground/50 italic text-sm"
            >
              <CheckSquareIcon className="w-12 h-12 mb-3 opacity-20" />
              <p>No tasks found.</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  key={task.id}
                  className={cn(
                    "group flex flex-col p-4 rounded-2xl border transition-all duration-300",
                    task.completed 
                      ? "bg-black/20 border-white/5 opacity-60" 
                      : overdue 
                        ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30"
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 overflow-hidden mt-0.5">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none mt-0.5"
                      >
                        {task.completed ? (
                          <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "font-medium truncate transition-all duration-300 text-sm",
                          task.completed ? "line-through text-muted-foreground" : (overdue ? "text-rose-200" : "text-foreground")
                        )}>
                          {task.title}
                        </span>
                        
                        {(task.dueDate || task.notes) && !task.completed && (
                          <div className="flex flex-col gap-1 mt-1.5">
                            {task.dueDate && (
                              <div className={cn(
                                "flex items-center gap-1 text-[10px] font-medium",
                                overdue ? "text-rose-400" : "text-muted-foreground"
                              )}>
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(task.dueDate)}
                                {overdue && " (Overdue)"}
                              </div>
                            )}
                            {task.notes && (
                              <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-0.5">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 flex-shrink-0 ml-2">
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap",
                          priorityColors[task.priority]
                        )}>
                          {task.priority}
                        </span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap",
                          categoryColors[task.category] || categoryColors.Other
                        )}>
                          {task.category}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all focus:outline-none ml-1 p-1 rounded hover:bg-white/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Temporary icon to avoid importing extra if not needed
function CheckSquareIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
}
