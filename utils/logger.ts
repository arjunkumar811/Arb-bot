export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export function log(level: LogLevel, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, message, ...args);
}

export function info(message: string, ...args: any[]) {
  log(LogLevel.INFO, message, ...args);
}

export function warn(message: string, ...args: any[]) {
  log(LogLevel.WARN, message, ...args);
}

export function error(message: string, ...args: any[]) {
  log(LogLevel.ERROR, message, ...args);
}
