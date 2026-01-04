import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GemsDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizeConfig = {
  sm: { icon: 14, text: 'text-sm' },
  md: { icon: 18, text: 'text-base' },
  lg: { icon: 24, text: 'text-lg' },
};

export function GemsDisplay({ amount, size = 'md', animate = true }: GemsDisplayProps) {
  const config = sizeConfig[size];
  // Habitica stores gems as balance * 4, handle undefined/null
  const gems = Math.floor((amount || 0) * 4);

  return (
    <motion.div
      className="flex items-center gap-1.5"
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Gem className="text-gems" size={config.icon} />
      <span className={cn("font-semibold text-gems", config.text)}>
        {gems.toLocaleString()}
      </span>
    </motion.div>
  );
}
