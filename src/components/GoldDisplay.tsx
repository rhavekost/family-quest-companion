import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GoldDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizeConfig = {
  sm: { icon: 14, text: 'text-sm' },
  md: { icon: 18, text: 'text-base' },
  lg: { icon: 24, text: 'text-lg' },
};

export function GoldDisplay({ amount, size = 'md', animate = true }: GoldDisplayProps) {
  const config = sizeConfig[size];
  const formattedAmount = (amount || 0).toFixed(2);

  return (
    <motion.div
      className="flex items-center gap-1.5"
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Coins className="text-gold" size={config.icon} />
      <span className={cn("font-semibold text-gold", config.text)}>
        {parseFloat(formattedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </motion.div>
  );
}
