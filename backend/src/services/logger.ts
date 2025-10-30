import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const ENABLE_FILE = (process.env.LOG_TO_FILE === '0' || process.env.LOG_TO_FILE === 'false') ? false : true;
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.txt');

function ensureLogFile() {
  if (!ENABLE_FILE) return;
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '', 'utf8');
    }
  } catch {
    // Falha silenciosa para não quebrar a app por causa de logs
  }
}

ensureLogFile();

function format(now: Date, level: LogLevel, event: string, data?: Record<string, unknown>): string {
  const ts = now.toISOString();
  const base = `${ts} ${level.toUpperCase()} ${event}`;
  if (!data || Object.keys(data).length === 0) return base;
  const compact = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' ');
  return compact ? `${base} ${compact}` : base;
}

function out(level: LogLevel, event: string, data?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LEVEL]) return;
  const line = format(new Date(), level, event, data);
  // Console
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
  // File
  if (ENABLE_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
    } catch {
      // silencioso
    }
  }
}

export const logger = {
  debug(event: string, data?: Record<string, unknown>) { out('debug', event, data); },
  info(event: string, data?: Record<string, unknown>) { out('info', event, data); },
  warn(event: string, data?: Record<string, unknown>) { out('warn', event, data); },
  error(event: string, data?: Record<string, unknown>) { out('error', event, data); }
};

export function reqSummary(method: string, url: string, status?: number, ms?: number) {
  logger.info('http', { method, url, status, ms });
}

export function writeRaw(prefix: string, content: string, extension = 'txt') {
  if (!ENABLE_FILE) return;
  try {
    ensureLogFile();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${prefix}-${ts}.${extension}`;
    const filePath = path.join(LOG_DIR, filename);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch {
    // silencioso
  }
}


