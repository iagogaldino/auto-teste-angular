"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.reqSummary = reqSummary;
exports.writeRaw = writeRaw;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};
const CURRENT_LEVEL = process.env.LOG_LEVEL || 'info';
const ENABLE_FILE = (process.env.LOG_TO_FILE === '0' || process.env.LOG_TO_FILE === 'false') ? false : true;
const LOG_DIR = process.env.LOG_DIR || path_1.default.join(process.cwd(), 'logs');
const LOG_FILE = path_1.default.join(LOG_DIR, 'app.txt');
function ensureLogFile() {
    if (!ENABLE_FILE)
        return;
    try {
        if (!fs_1.default.existsSync(LOG_DIR)) {
            fs_1.default.mkdirSync(LOG_DIR, { recursive: true });
        }
        if (!fs_1.default.existsSync(LOG_FILE)) {
            fs_1.default.writeFileSync(LOG_FILE, '', 'utf8');
        }
    }
    catch {
    }
}
ensureLogFile();
function format(now, level, event, data) {
    const ts = now.toISOString();
    const base = `${ts} ${level.toUpperCase()} ${event}`;
    if (!data || Object.keys(data).length === 0)
        return base;
    const compact = Object.entries(data)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(' ');
    return compact ? `${base} ${compact}` : base;
}
function out(level, event, data) {
    if (LOG_LEVELS[level] < LOG_LEVELS[CURRENT_LEVEL])
        return;
    const line = format(new Date(), level, event, data);
    if (level === 'error') {
        console.error(line);
    }
    else if (level === 'warn') {
        console.warn(line);
    }
    else {
        console.log(line);
    }
    if (ENABLE_FILE) {
        try {
            fs_1.default.appendFileSync(LOG_FILE, line + '\n', 'utf8');
        }
        catch {
        }
    }
}
exports.logger = {
    debug(event, data) { out('debug', event, data); },
    info(event, data) { out('info', event, data); },
    warn(event, data) { out('warn', event, data); },
    error(event, data) { out('error', event, data); }
};
function reqSummary(method, url, status, ms) {
    exports.logger.info('http', { method, url, status, ms });
}
function writeRaw(prefix, content, extension = 'txt') {
    if (!ENABLE_FILE)
        return;
    try {
        ensureLogFile();
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${prefix}-${ts}.${extension}`;
        const filePath = path_1.default.join(LOG_DIR, filename);
        fs_1.default.writeFileSync(filePath, content, 'utf8');
    }
    catch {
    }
}
//# sourceMappingURL=logger.js.map