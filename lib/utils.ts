import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lightweight logger with env-controlled levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 50 };
const envLevel = (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel)) || 'warn';

function shouldLog(threshold: LogLevel) {
  return levelOrder[envLevel] <= levelOrder[threshold];
}

export const logger = {
  debug: (...args: any[]) => { if (shouldLog('debug')) console.debug(...args); },
  info:  (...args: any[]) => { if (shouldLog('info')) console.info(...args); },
  warn:  (...args: any[]) => { if (shouldLog('warn')) console.warn(...args); },
  error: (...args: any[]) => { if (shouldLog('error')) console.error(...args); },
};

// Brand colors for charts, avatars, and UI accents
export const COLORS = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
] as const;

