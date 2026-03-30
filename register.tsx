import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Hexagon, ArrowRight, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const [, setLocation] = useLocation();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const success = register(username, password);
    if (success) {
      setLocation("/");
    } else {
      setError("Username already taken. Please choose another.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <img 
        src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
        alt="Abstract background" 
        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
              <Hexagon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-center mb-2">Join Tracker</h1>
            <p className="text-muted-foreground text-center">Start your productivity journey today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 pl-1">Choose Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. alex_dev"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80 pl-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group mt-6"
            >
              <span>Create Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
