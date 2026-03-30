import { useHabits } from "@/hooks/use-habits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export function PerformanceCard() {
  const { last7DaysPerformance } = useHabits();
  const { data, maxHabitsInWeek } = last7DaysPerformance;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col h-[350px]">
      <h2 className="text-xl font-display font-bold mb-2">Weekly Performance</h2>
      <p className="text-sm text-muted-foreground mb-6">Habits completed per day over the last 7 days</p>

      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              domain={[0, Math.max(4, maxHabitsInWeek)]}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                backgroundColor: 'rgba(10, 10, 15, 0.8)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff'
              }}
            />
            <Bar 
              dataKey="completed" 
              name="Habits Done"
              fill="url(#colorCompleted)" 
              radius={[6, 6, 6, 6]} 
              barSize={30}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
