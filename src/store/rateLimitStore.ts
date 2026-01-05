import { create } from 'zustand';

interface RateLimitState {
  remaining: number | null;
  resetTime: Date | null;
  updateRateLimit: (remaining: number, resetTime: string) => void;
}

export const useRateLimitStore = create<RateLimitState>((set) => ({
  remaining: null,
  resetTime: null,
  updateRateLimit: (remaining: number, resetTime: string) => {
    set({
      remaining,
      resetTime: new Date(resetTime),
    });
  },
}));
