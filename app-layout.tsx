import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex min-h-screen bg-[#05050A] text-foreground overflow-hidden selection:bg-primary/30">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-7xl mx-auto p-4 md:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
