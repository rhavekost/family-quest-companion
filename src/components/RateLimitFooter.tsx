import { useRateLimitStore } from "@/store/rateLimitStore";
import { Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RateLimitFooter() {
  const { remaining, resetTime } = useRateLimitStore();

  if (remaining === null || resetTime === null) {
    return null;
  }

  const isLow = remaining < 10;
  const resetDistance = formatDistanceToNow(resetTime, { addSuffix: true });

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/40 px-4 py-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity size={14} className={isLow ? "text-amber-500" : "text-muted-foreground"} />
          <span>
            <span className={isLow ? "text-amber-500 font-medium" : ""}>
              {remaining}
            </span>
            {" requests remaining"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} />
          <span>Resets {resetDistance}</span>
        </div>
      </div>
    </footer>
  );
}
