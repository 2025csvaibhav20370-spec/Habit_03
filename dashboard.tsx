import { AppLayout } from "@/components/layout/app-layout";
import { TaskCard } from "@/components/dashboard/task-card";
import { HabitCard } from "@/components/dashboard/habit-card";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { PerformanceCard } from "@/components/dashboard/performance-card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-2">
          {greeting()}, <span className="text-gradient">{user?.username}</span>
        </h1>
        <p className="text-muted-foreground text-lg">Let's make today incredibly productive.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={item}>
          <TaskCard />
        </motion.div>
        <motion.div variants={item}>
          <HabitCard />
        </motion.div>
        <motion.div variants={item}>
          <AnalyticsCard />
        </motion.div>
        <motion.div variants={item}>
          <PerformanceCard />
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
