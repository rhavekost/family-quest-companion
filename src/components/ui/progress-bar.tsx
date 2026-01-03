import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'health' | 'mana' | 'exp' | 'default';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const variantStyles = {
  health: {
    bg: 'bg-health/20',
    fill: 'bg-gradient-to-r from-red-600 to-red-400',
    glow: 'shadow-[0_0_10px_rgba(247,78,82,0.5)]',
  },
  mana: {
    bg: 'bg-mana/20',
    fill: 'bg-gradient-to-r from-blue-600 to-blue-400',
    glow: 'shadow-[0_0_10px_rgba(41,149,205,0.5)]',
  },
  exp: {
    bg: 'bg-exp/20',
    fill: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
    glow: 'shadow-[0_0_10px_rgba(255,204,0,0.5)]',
  },
  default: {
    bg: 'bg-primary/20',
    fill: 'bg-gradient-to-r from-primary to-primary-glow',
    glow: 'shadow-[0_0_10px_rgba(97,51,180,0.5)]',
  },
};

const sizeStyles = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max,
  variant = 'default',
  showText = false,
  size = 'md',
  className,
  animate = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const styles = variantStyles[variant];

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "w-full rounded-full overflow-hidden",
          styles.bg,
          sizeStyles[size]
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            styles.fill,
            styles.glow
          )}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {showText && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground/70 ml-2">
          {Math.round(value)}/{max}
        </span>
      )}
    </div>
  );
}
