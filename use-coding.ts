import { useLocalStorage } from "./use-local-storage";
import { useAuth } from "./use-auth";
import { useMemo } from "react";
import { format, subDays, startOfMonth, eachDayOfInterval, endOfMonth } from "date-fns";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Platform = "LeetCode" | "HackerRank" | "Codeforces" | "AtCoder" | "CodeChef" | "Custom";
export type ProblemStatus = "solved-in-time" | "solved-overtime" | "not-solved";

export interface CodingProblem {
  id: string;
  name: string;
  difficulty: Difficulty;
  platform: Platform;
  timeLimitSeconds: number;
  timeTakenSeconds: number | null;
  status: ProblemStatus;
  solvedAt: string;
  date: string;
}

export interface CodingSettings {
  dailyGoal: number;
  defaultTimeLimitMinutes: number;
}

const DEFAULT_SETTINGS: CodingSettings = {
  dailyGoal: 3,
  defaultTimeLimitMinutes: 30,
};

export function useCoding() {
  const { user } = useAuth();

  const [allProblems, setAllProblems] = useLocalStorage<Record<string, CodingProblem[]>>(
    "prod_tracker_coding_v1",
    {}
  );
  const [allSettings, setAllSettings] = useLocalStorage<Record<string, CodingSettings>>(
    "prod_tracker_coding_settings",
    {}
  );

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const userProblems = useMemo(() => {
    if (!user) return [];
    return allProblems[user.username] || [];
  }, [allProblems, user]);

  const settings = useMemo((): CodingSettings => {
    if (!user) return DEFAULT_SETTINGS;
    return allSettings[user.username] || DEFAULT_SETTINGS;
  }, [allSettings, user]);

  const todayProblems = useMemo(
    () => userProblems.filter((p) => p.date === todayStr),
    [userProblems, todayStr]
  );

  const saveSettings = (s: CodingSettings) => {
    if (!user) return;
    setAllSettings((prev) => ({ ...prev, [user.username]: s }));
  };

  const logProblem = (problem: Omit<CodingProblem, "id" | "solvedAt" | "date">) => {
    if (!user) return;
    const newProblem: CodingProblem = {
      ...problem,
      id: crypto.randomUUID(),
      solvedAt: new Date().toISOString(),
      date: todayStr,
    };
    setAllProblems((prev) => ({
      ...prev,
      [user.username]: [newProblem, ...(prev[user.username] || [])],
    }));
  };

  const deleteProblem = (id: string) => {
    if (!user) return;
    setAllProblems((prev) => ({
      ...prev,
      [user.username]: (prev[user.username] || []).filter((p) => p.id !== id),
    }));
  };

  const todayStats = useMemo(() => {
    const solved = todayProblems.filter(
      (p) => p.status === "solved-in-time" || p.status === "solved-overtime"
    ).length;
    const inTime = todayProblems.filter((p) => p.status === "solved-in-time").length;
    const overtime = todayProblems.filter((p) => p.status === "solved-overtime").length;
    const notSolved = todayProblems.filter((p) => p.status === "not-solved").length;
    return { solved, inTime, overtime, notSolved, total: todayProblems.length };
  }, [todayProblems]);

  // Pie chart — result breakdown (all-time)
  const resultPieData = useMemo(() => {
    const inTime = userProblems.filter((p) => p.status === "solved-in-time").length;
    const overtime = userProblems.filter((p) => p.status === "solved-overtime").length;
    const notSolved = userProblems.filter((p) => p.status === "not-solved").length;
    return [
      { name: "Solved In Time", value: inTime, color: "#34d399" },
      { name: "Solved Overtime", value: overtime, color: "#fbbf24" },
      { name: "Not Solved", value: notSolved, color: "#f87171" },
    ].filter((d) => d.value > 0);
  }, [userProblems]);

  // Pie chart — difficulty breakdown (all-time)
  const difficultyPieData = useMemo(() => {
    const easy = userProblems.filter((p) => p.difficulty === "Easy").length;
    const medium = userProblems.filter((p) => p.difficulty === "Medium").length;
    const hard = userProblems.filter((p) => p.difficulty === "Hard").length;
    return [
      { name: "Easy", value: easy, color: "#34d399" },
      { name: "Medium", value: medium, color: "#fbbf24" },
      { name: "Hard", value: hard, color: "#f87171" },
    ].filter((d) => d.value > 0);
  }, [userProblems]);

  // Last 7 days
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dStr = format(d, "yyyy-MM-dd");
      const dayProblems = userProblems.filter((p) => p.date === dStr);
      return {
        day: format(d, "EEE"),
        date: dStr,
        solved: dayProblems.filter(
          (p) => p.status === "solved-in-time" || p.status === "solved-overtime"
        ).length,
        total: dayProblems.length,
      };
    });
  }, [userProblems]);

  // Monthly performance — each day of current month
  const monthlyData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });
    return days.map((d) => {
      const dStr = format(d, "yyyy-MM-dd");
      const dayProblems = userProblems.filter((p) => p.date === dStr);
      const solved = dayProblems.filter(
        (p) => p.status === "solved-in-time" || p.status === "solved-overtime"
      ).length;
      return {
        day: format(d, "d"),
        date: dStr,
        solved,
        total: dayProblems.length,
        goalMet: solved >= settings.dailyGoal,
        isFuture: d > now,
      };
    });
  }, [userProblems, settings.dailyGoal]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStr = format(now, "yyyy-MM");
    const monthProblems = userProblems.filter((p) => p.date.startsWith(monthStr));
    const totalSolved = monthProblems.filter(
      (p) => p.status === "solved-in-time" || p.status === "solved-overtime"
    ).length;
    const easy = monthProblems.filter((p) => p.difficulty === "Easy").length;
    const medium = monthProblems.filter((p) => p.difficulty === "Medium").length;
    const hard = monthProblems.filter((p) => p.difficulty === "Hard").length;
    const daysWithGoal = monthlyData.filter((d) => !d.isFuture && d.goalMet).length;
    const activeDays = monthlyData.filter((d) => !d.isFuture && d.total > 0).length;
    return { totalSolved, easy, medium, hard, daysWithGoal, activeDays, total: monthProblems.length };
  }, [userProblems, monthlyData]);

  return {
    settings,
    saveSettings,
    todayProblems,
    allProblems: userProblems,
    logProblem,
    deleteProblem,
    todayStats,
    last7Days,
    resultPieData,
    difficultyPieData,
    monthlyData,
    monthlyStats,
  };
}
