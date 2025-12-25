/**
 * Production-safe logging utility
 * Only logs in development mode
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('ℹ️', ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('🔍', ...args);
    }
  },
};


