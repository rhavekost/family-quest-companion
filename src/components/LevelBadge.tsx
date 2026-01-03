import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LevelBadgeProps {
  level: number;
  exp: number;
  toNextLevel: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { badge: 'w-10 h-10', text: 'text-sm', ring: 32 },
  md: { badge: 'w-14 h-14', text: 'text-lg', ring: 48 },
  lg: { badge: 'w-20 h-20', text: 'text-2xl', ring: 72 },
};

export function LevelBadge({ level, exp, toNextLevel, size = 'md' }: LevelBadgeProps) {
  const config = sizeConfig[size];
  const progress = (exp / toNextLevel) * 100;
  const circumference = 2 * Math.PI * (config.ring / 2 - 4);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* XP Ring */}
      <svg
        className="absolute transform -rotate-90"
        width={config.ring}
        height={config.ring}
      >
        <circle
          className="text-muted"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={config.ring / 2 - 4}
          cx={config.ring / 2}
          cy={config.ring / 2}
        />
        <motion.circle
          className="text-exp"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={config.ring / 2 - 4}
          cx={config.ring / 2}
          cy={config.ring / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
            strokeLinecap: "round",
          }}
        />
      </svg>
      
      {/* Level Number */}
      <motion.div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center font-display font-bold text-foreground glow-primary",
          config.badge
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <span className={config.text}>{level}</span>
      </motion.div>
    </div>
  );
}
