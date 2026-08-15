// `cn` used to be re-exported from here. It is gone, and it was already gone in
// every sense that matters: three files imported it and NONE of them called it.
//
// The canonical shorthand in a gui app is a PROP. A class-name composer is the
// tool you reach for when styling lives in class strings, and it does not here —
// it lives in style props on the token scale, and the only class names left are
// stable `hz-` handles for the few facts CSS has to own. Keeping a composer
// around for them is keeping the door to the old way open.

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
  "#171717", "#2e2e2e", "#454545", "#5c5c5c", "#737373",
  "#8a8a8a", "#a1a1a1", "#b8b8b8", "#cfcfcf", "#e6e6e6",
] as const;

