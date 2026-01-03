import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StreakBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { icon: 14, text: 'text-xs', wrapper: 'px-2 py-0.5' },
  md: { icon: 16, text: 'text-sm', wrapper: 'px-2.5 py-1' },
  lg: { icon: 20, text: 'text-base', wrapper: 'px-3 py-1.5' },
};

export function StreakBadge({ count, size = 'md' }: StreakBadgeProps) {
  const config = sizeConfig[size];
  const isHot = count >= 7;
  const isOnFire = count >= 30;

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        config.wrapper,
        isOnFire
          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
          : isHot
          ? "bg-orange-500/20 text-orange-400"
          : "bg-muted text-muted-foreground"
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        animate={isHot ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        <Flame size={config.icon} />
      </motion.div>
      <span className={config.text}>{count}</span>
    </motion.div>
  );
}
