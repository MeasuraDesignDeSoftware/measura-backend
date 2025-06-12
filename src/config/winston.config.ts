import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

interface LogInfo extends winston.Logform.TransformableInfo {
  timestamp?: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
  [key: string]: any;
}

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize(),
        winston.format.printf((info: LogInfo) => {
          const { timestamp, level, message, context, trace, ...meta } = info;
          const contextStr = context ? `[${context}] ` : '';
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const traceStr = trace ? `\n${trace}` : '';

          return `${timestamp} [${level}] ${contextStr}${message} ${metaStr}${traceStr}`;
        }),
      ),
    }),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
