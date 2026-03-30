import { useTasks } from "@/hooks/use-tasks";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

export function AnalyticsCard() {
  const { stats } = useTasks();
  
  // Use overall total stats instead of just today
  const completionPercentage = stats.totalTasks === 0 
    ? 0 
    : Math.round((stats.totalCompleted / stats.totalTasks) * 100);

  const data = [
    { name: "Completed", value: stats.totalCompleted, color: "hsl(var(--primary))" },
    { name: "Pending", value: stats.totalPending, color: "hsl(var(--muted))" },
  ];

  return (
    <div id="analytics" className="glass-card rounded-3xl p-6 flex flex-col h-[350px]">
      <h2 className="text-xl font-display font-bold mb-2">Total Progress</h2>
      <p className="text-sm text-muted-foreground mb-2">Overall task completion</p>

      <div className="flex-1 relative flex items-center justify-center py-2">
        {stats.totalTasks === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No tasks added yet.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 15, 0.8)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.span 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="text-3xl font-display font-bold text-gradient"
              >
                {completionPercentage}%
              </motion.span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                Done
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{stats.totalTasks}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total</span>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-primary">{stats.totalCompleted}</span>
          <span className="text-[10px] text-primary/70 uppercase tracking-wider mt-1">Done</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{stats.totalPending}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">To Do</span>
        </div>
      </div>
    </div>
  );
}
