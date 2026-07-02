const winston = require('winston');

const { combine, timestamp, json, colorize, printf } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

// Human-readable format for development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isDev ? combine(colorize(), devFormat) : json()
  ),
  transports: [
    new winston.transports.Console(),
    // In production, persist logs to files for post-mortem debugging (if not in serverless/Vercel)
    ...(!isDev && !process.env.IS_VERCEL ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }),
      new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 }),
    ] : []),
  ],
  defaultMeta: { service: 'incognicare-api' },
});

module.exports = logger;
