import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useCoding, Difficulty, Platform, ProblemStatus, CodingSettings } from "@/hooks/use-coding";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Code2, Play, Square, CheckCircle2, XCircle, Clock, Trophy,
  Trash2, Settings, ChevronDown, ChevronUp, BarChart3, Target,
  Timer, Flame, Plus, AlertCircle, Calendar, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { format } from "date-fns";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const PLATFORMS: Platform[] = ["LeetCode", "HackerRank", "Codeforces", "AtCoder", "CodeChef", "Custom"];

const diffColors: Record<Difficulty, string> = {
  Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

const statusConfig: Record<ProblemStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  "solved-in-time": { label: "Solved ✓", icon: CheckCircle2, color: "text-emerald-400" },
  "solved-overtime": { label: "Solved (Overtime)", icon: CheckCircle2, color: "text-amber-400" },
  "not-solved": { label: "Not Solved", icon: XCircle, color: "text-rose-400" },
};

function formatTime(seconds: number) {
  const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, "0");
  const s = (Math.abs(seconds) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0f]/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2 text-sm">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value} problem{payload[0].value !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
};

function TimerDisplay({ seconds, limitSeconds, running }: { seconds: number; limitSeconds: number; running: boolean }) {
  const pct = limitSeconds > 0 ? Math.max(0, seconds / limitSeconds) : 0;
  const isLow = pct < 0.25 && seconds <= limitSeconds;
  const isOvertime = seconds < 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn(
        "text-6xl font-mono font-extrabold tracking-tight tabular-nums transition-colors",
        isOvertime ? "text-rose-400 animate-pulse" : isLow ? "text-amber-400" : "text-foreground"
      )}>
        {seconds >= 0 ? formatTime(seconds) : `+${formatTime(seconds)}`}
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors", isOvertime ? "bg-rose-500" : isLow ? "bg-amber-400" : "bg-gradient-to-r from-primary to-accent")}
          animate={{ width: `${Math.max(0, pct * 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {running && (
        <p className="text-xs text-muted-foreground">
          {isOvertime ? "⚠️ Time limit exceeded — still solving?" : `Elapsed: ${formatTime(limitSeconds - seconds)}`}
        </p>
      )}
    </div>
  );
}

export default function CodingChallenge() {
  const {
    settings, saveSettings, todayProblems, logProblem, deleteProblem,
    todayStats, last7Days, resultPieData, difficultyPieData, monthlyData, monthlyStats
  } = useCoding();

  const [activeTab, setActiveTab] = useState<"solve" | "monthly">("solve");
  const [showSettings, setShowSettings] = useState(false);
  const [draftGoal, setDraftGoal] = useState(settings.dailyGoal);
  const [draftLimit, setDraftLimit] = useState(settings.defaultTimeLimitMinutes);

  const [problemName, setProblemName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [platform, setPlatform] = useState<Platform>("LeetCode");
  const [customLimit, setCustomLimit] = useState<number | "">(settings.defaultTimeLimitMinutes);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.defaultTimeLimitMinutes * 60);
  const [timerStarted, setTimerStarted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showAll, setShowAll] = useState(false);
  const [pieMode, setPieMode] = useState<"result" | "difficulty">("result");

  const limitSec = (typeof customLimit === "number" ? customLimit : settings.defaultTimeLimitMinutes) * 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    setTimerRunning(false);
    setTimerStarted(false);
    setTimeLeft(limitSec);
    startTimeRef.current = null;
  }, [clearTimer, limitSec]);

  useEffect(() => {
    if (!timerStarted) setTimeLeft(limitSec);
  }, [limitSec, timerStarted]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [timerRunning, clearTimer]);

  const handleStartTimer = () => {
    if (!problemName.trim()) return;
    startTimeRef.current = Date.now();
    setTimerStarted(true);
    setTimerRunning(true);
  };

  const getTimeTaken = () =>
    startTimeRef.current !== null ? Math.floor((Date.now() - startTimeRef.current) / 1000) : null;

  const handleLogResult = (status: ProblemStatus) => {
    logProblem({ name: problemName.trim() || "Untitled", difficulty, platform, timeLimitSeconds: limitSec, timeTakenSeconds: getTimeTaken(), status });
    setProblemName(""); setDifficulty("Medium"); setPlatform("LeetCode");
    setCustomLimit(settings.defaultTimeLimitMinutes); resetTimer();
  };

  const handleSaveSettings = () => {
    const s: CodingSettings = { dailyGoal: Math.max(1, draftGoal), defaultTimeLimitMinutes: Math.max(1, draftLimit) };
    saveSettings(s);
    setShowSettings(false);
    if (!timerStarted) setTimeLeft(s.defaultTimeLimitMinutes * 60);
  };

  const goalPct = Math.min(100, (todayStats.solved / settings.dailyGoal) * 100);
  const displayedHistory = showAll ? todayProblems : todayProblems.slice(0, 5);
  const pieData = pieMode === "result" ? resultPieData : difficultyPieData;
  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  const monthName = format(new Date(), "MMMM yyyy");
  const maxDay = Math.max(1, ...monthlyData.map((d) => d.solved));

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-2 flex items-center gap-3">
            <Code2 className="w-9 h-9 text-primary" />
            <span>Coding <span className="text-gradient">Challenge</span></span>
          </h1>
          <p className="text-muted-foreground">Solve problems with a timer. Track your daily &amp; monthly progress.</p>
        </div>
        <button
          onClick={() => { setDraftGoal(settings.dailyGoal); setDraftLimit(settings.defaultTimeLimitMinutes); setShowSettings(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "solve", label: "Solve & Track", icon: Code2 },
          { id: "monthly", label: "Monthly Performance", icon: Calendar },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === id
                ? "bg-primary/10 text-primary border border-primary/30 shadow-inner"
                : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Daily Settings</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Daily Problem Goal</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDraftGoal((v) => Math.max(1, v - 1))} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-lg transition-all">−</button>
                    <span className="text-2xl font-bold w-10 text-center">{draftGoal}</span>
                    <button onClick={() => setDraftGoal((v) => v + 1)} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-lg transition-all">+</button>
                    <span className="text-muted-foreground text-sm">problems/day</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Default Time Limit</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDraftLimit((v) => Math.max(5, v - 5))} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-lg transition-all">−</button>
                    <span className="text-2xl font-bold w-10 text-center">{draftLimit}</span>
                    <button onClick={() => setDraftLimit((v) => v + 5)} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-lg transition-all">+</button>
                    <span className="text-muted-foreground text-sm">minutes</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-medium">Cancel</button>
                <button onClick={handleSaveSettings} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium text-sm shadow-lg hover:shadow-primary/40 transition-all">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOLVE & TRACK TAB ── */}
      <AnimatePresence mode="wait">
        {activeTab === "solve" && (
          <motion.div key="solve" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT */}
              <div className="space-y-5">
                {/* Daily goal */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><span className="font-bold">Daily Goal</span></div>
                    <span className="text-sm font-semibold text-muted-foreground">{todayStats.solved} / {settings.dailyGoal}</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${goalPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "In Time", value: todayStats.inTime, color: "text-emerald-400" },
                      { label: "Overtime", value: todayStats.overtime, color: "text-amber-400" },
                      { label: "Not Solved", value: todayStats.notSolved, color: "text-rose-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-black/20 rounded-xl p-3 text-center">
                        <p className={cn("text-2xl font-bold", color)}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                  {goalPct >= 100 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                      <Trophy className="w-4 h-4" /> Daily goal reached! Great work 🎉
                    </motion.div>
                  )}
                </div>

                {/* Form */}
                <div className="glass-card rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> New Problem</h3>
                  <input type="text" value={problemName} onChange={(e) => setProblemName(e.target.value)} placeholder="Problem name or number (e.g., Two Sum)" disabled={timerStarted}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Difficulty</label>
                      <div className="flex gap-1.5">
                        {DIFFICULTIES.map((d) => (
                          <button key={d} disabled={timerStarted} onClick={() => setDifficulty(d)}
                            className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50",
                              difficulty === d ? diffColors[d] : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10")}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Platform</label>
                      <select value={platform} disabled={timerStarted} onChange={(e) => setPlatform(e.target.value as Platform)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 disabled:opacity-50">
                        {PLATFORMS.map((p) => <option key={p} value={p} className="bg-background">{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setShowAdvanced((v) => !v)} disabled={timerStarted}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Override time limit for this problem
                  </button>
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-3 pt-1">
                          <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <input type="number" min={1} max={240} value={customLimit}
                            onChange={(e) => setCustomLimit(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={timerStarted}
                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-primary/50 disabled:opacity-50" />
                          <span className="text-sm text-muted-foreground">minutes for this problem</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Timer */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-bold mb-5 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Countdown Timer</h3>
                  <TimerDisplay seconds={timeLeft} limitSeconds={limitSec} running={timerRunning} />
                  <div className="flex gap-3 mt-6">
                    {!timerStarted ? (
                      <button onClick={handleStartTimer} disabled={!problemName.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                        <Play className="w-5 h-5" /> Start Timer
                      </button>
                    ) : timerRunning ? (
                      <button onClick={() => setTimerRunning(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold hover:bg-amber-500/20 transition-all">
                        <Square className="w-4 h-4 fill-current" /> Pause
                      </button>
                    ) : (
                      <button onClick={() => setTimerRunning(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 transition-all">
                        <Play className="w-4 h-4" /> Resume
                      </button>
                    )}
                    {timerStarted && (
                      <button onClick={resetTimer} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-muted-foreground">Reset</button>
                    )}
                  </div>
                  <AnimatePresence>
                    {timerStarted && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 space-y-2">
                        <p className="text-xs text-muted-foreground text-center mb-3 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> How did it go? Log your result:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { status: "solved-in-time" as ProblemStatus, label: "Solved ✓", icon: CheckCircle2, cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" },
                            { status: "solved-overtime" as ProblemStatus, label: "Overtime", icon: Clock, cls: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" },
                            { status: "not-solved" as ProblemStatus, label: "Stuck", icon: XCircle, cls: "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20" },
                          ].map(({ status, label, icon: Icon, cls }) => (
                            <button key={status} onClick={() => handleLogResult(status)}
                              className={cn("py-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1", cls)}>
                              <Icon className="w-4 h-4" /> {label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                {/* Pie Chart */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> All-Time Breakdown</h3>
                    <div className="flex gap-1 text-xs">
                      {(["result", "difficulty"] as const).map((m) => (
                        <button key={m} onClick={() => setPieMode(m)}
                          className={cn("px-3 py-1 rounded-lg font-medium transition-all capitalize",
                            pieMode === m ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground hover:bg-white/10")}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {totalPie === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground/40 text-sm italic">
                      <Code2 className="w-10 h-10 mb-2 opacity-20" />
                      No problems logged yet
                    </div>
                  ) : (
                    <div className="h-[220px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                            paddingAngle={4} dataKey="value" stroke="none" cornerRadius={6} animationBegin={0} animationDuration={800}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend iconType="circle" iconSize={8}
                            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: "-18px" }}>
                        <span className="text-3xl font-extrabold text-gradient">{totalPie}</span>
                        <span className="text-xs text-muted-foreground">total</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly bar chart */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Last 7 Days</h3>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7Days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="codingBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "rgba(10,10,15,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                        <Bar dataKey="solved" name="Solved" fill="url(#codingBar)" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Today's log */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Today's Log</h3>
                    <span className="text-xs text-muted-foreground">{todayProblems.length} problems</span>
                  </div>
                  {todayProblems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/40 italic text-sm">
                      <Code2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No problems logged today
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {displayedHistory.map((p) => {
                          const sc = statusConfig[p.status];
                          return (
                            <motion.div layout key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                              className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                              <sc.icon className={cn("w-4 h-4 flex-shrink-0", sc.color)} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={cn("text-xs px-1.5 py-0.5 rounded-md border font-medium", diffColors[p.difficulty])}>{p.difficulty}</span>
                                  <span className="text-xs text-muted-foreground">{p.platform}</span>
                                  {p.timeTakenSeconds !== null && <span className="text-xs text-muted-foreground">· {formatTime(p.timeTakenSeconds)}</span>}
                                </div>
                              </div>
                              <button onClick={() => deleteProblem(p.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded-lg hover:bg-white/10 flex-shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {todayProblems.length > 5 && (
                        <button onClick={() => setShowAll((v) => !v)}
                          className="w-full text-xs text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1 transition-colors">
                          {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show {todayProblems.length - 5} more</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MONTHLY PERFORMANCE TAB ── */}
        {activeTab === "monthly" && (
          <motion.div key="monthly" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
            {/* Monthly summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Solved", value: monthlyStats.totalSolved, color: "text-primary" },
                { label: "Active Days", value: monthlyStats.activeDays, color: "text-blue-400" },
                { label: "Goal Days", value: monthlyStats.daysWithGoal, color: "text-emerald-400" },
                { label: "Easy", value: monthlyStats.easy, color: "text-emerald-400" },
                { label: "Medium", value: monthlyStats.medium, color: "text-amber-400" },
                { label: "Hard", value: monthlyStats.hard, color: "text-rose-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card rounded-2xl p-4 text-center">
                  <p className={cn("text-3xl font-extrabold", color)}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Area chart — problems per day this month */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {monthName} — Problems Solved Per Day
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={8}
                      interval={2} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                      contentStyle={{ backgroundColor: "rgba(10,10,15,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: number) => [val, "Solved"]} labelFormatter={(l) => `Day ${l}`} />
                    <Area type="monotone" dataKey="solved" name="Solved" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaGrad)" animationDuration={1200} dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 5, fill: "hsl(var(--primary))" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap calendar grid */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {monthName} — Daily Heatmap
              </h3>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium">{d}</div>
                ))}
              </div>
              {/* Leading empty cells for the first day of month */}
              <div className="grid grid-cols-7 gap-2">
                {/* blank spacers */}
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {monthlyData.map((d) => {
                  const intensity = maxDay > 0 ? d.solved / maxDay : 0;
                  return (
                    <motion.div
                      key={d.date}
                      whileHover={{ scale: 1.15 }}
                      title={`Day ${d.day}: ${d.solved} solved`}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-default relative group",
                        d.isFuture
                          ? "bg-white/5 text-muted-foreground/30"
                          : d.solved === 0
                            ? "bg-white/5 text-muted-foreground/50"
                            : d.goalMet
                              ? "bg-primary/80 text-white shadow-lg shadow-primary/30"
                              : intensity > 0.6
                                ? "bg-primary/50 text-white"
                                : intensity > 0.3
                                  ? "bg-primary/30 text-primary"
                                  : "bg-primary/15 text-primary/70"
                      )}
                    >
                      {d.day}
                      {/* Tooltip popup */}
                      {!d.isFuture && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max pointer-events-none">
                          <div className="bg-[#0a0a0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                            <p className="font-semibold">{d.solved} solved</p>
                            {d.goalMet && <p className="text-emerald-400 text-[10px]">Goal met ✓</p>}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 mt-5 text-xs text-muted-foreground">
                <span>Less</span>
                {["bg-white/5", "bg-primary/15", "bg-primary/30", "bg-primary/50", "bg-primary/80"].map((cls, i) => (
                  <div key={i} className={cn("w-5 h-5 rounded-md", cls)} />
                ))}
                <span>More</span>
                <span className="ml-2 flex items-center gap-1"><div className="w-5 h-5 rounded-md bg-primary/80 shadow-md shadow-primary/40" /> = Goal met</span>
              </div>
            </div>

            {/* Difficulty pie + platform breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Difficulty Mix (All Time)</h3>
                {difficultyPieData.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground/40 text-sm italic">No data yet</div>
                ) : (
                  <div className="h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={difficultyPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={6} animationDuration={800}>
                          {difficultyPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Result Breakdown (All Time)</h3>
                {resultPieData.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground/40 text-sm italic">No data yet</div>
                ) : (
                  <div className="h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={resultPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={6} animationDuration={800}>
                          {resultPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
