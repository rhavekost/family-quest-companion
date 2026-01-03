import { Sword, Sparkles, Heart, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassIconProps {
  className?: 'warrior' | 'mage' | 'healer' | 'rogue';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const classConfig = {
  warrior: {
    icon: Sword,
    label: 'Warrior',
    color: 'text-warrior',
    bg: 'bg-warrior/20',
  },
  mage: {
    icon: Sparkles,
    label: 'Mage',
    color: 'text-mage',
    bg: 'bg-mage/20',
  },
  healer: {
    icon: Heart,
    label: 'Healer',
    color: 'text-healer',
    bg: 'bg-healer/20',
  },
  rogue: {
    icon: Target,
    label: 'Rogue',
    color: 'text-rogue',
    bg: 'bg-rogue/20',
  },
};

const sizeConfig = {
  sm: { icon: 14, wrapper: 'w-6 h-6' },
  md: { icon: 18, wrapper: 'w-8 h-8' },
  lg: { icon: 24, wrapper: 'w-10 h-10' },
};

export function ClassIcon({
  className = 'warrior',
  size = 'md',
  showLabel = false,
}: ClassIconProps) {
  const config = classConfig[className];
  const sizeData = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center",
          config.bg,
          config.color,
          sizeData.wrapper
        )}
      >
        <Icon size={sizeData.icon} />
      </div>
      {showLabel && (
        <span className={cn("font-medium", config.color)}>{config.label}</span>
      )}
    </div>
  );
}
