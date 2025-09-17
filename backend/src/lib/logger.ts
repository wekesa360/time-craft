export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogMeta {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const CURRENT_LEVEL: LogLevel =
  (globalThis as any).LOG_LEVEL || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[CURRENT_LEVEL];
}

export const logger = {
  trace: (msg: string, meta?: LogMeta) => shouldLog('trace') && log('trace', msg, meta),
  debug: (msg: string, meta?: LogMeta) => shouldLog('debug') && log('debug', msg, meta),
  info:  (msg: string, meta?: LogMeta) => shouldLog('info')  && log('info',  msg, meta),
  warn:  (msg: string, meta?: LogMeta) => shouldLog('warn')  && log('warn',  msg, meta),
  error: (msg: string, meta?: LogMeta) => shouldLog('error') && log('error', msg, meta),
};

function log(level: LogLevel, message: string, meta?: LogMeta) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta || {}),
  };
  console.log(JSON.stringify(payload));
}