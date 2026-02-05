import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '../../config/config.service';

export function createWinstonConfig(configService: ConfigService): WinstonModuleOptions {
  const loggingConfig = configService.loggingConfig;
  const isPrettyFormat = loggingConfig.format === 'pretty';

  // Custom format for JSON logging
  const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json(),
  );

  // Format for development (more readable)
  const prettyFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, context, trace }) => {
      return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
    }),
  );

  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: isPrettyFormat ? prettyFormat : jsonFormat,
      level: loggingConfig.level,
    }),
  ];

  // Add file transports if enabled
  if (loggingConfig.file.enabled) {
    transports.push(
      // Error log file
      new winston.transports.File({
        filename: `${loggingConfig.file.path}/error.log`,
        level: 'error',
        format: jsonFormat,
        maxsize: loggingConfig.file.maxSize,
        maxFiles: loggingConfig.file.maxFiles,
      }),
      // Combined log file
      new winston.transports.File({
        filename: `${loggingConfig.file.path}/combined.log`,
        format: jsonFormat,
        maxsize: loggingConfig.file.maxSize,
        maxFiles: loggingConfig.file.maxFiles,
      }),
    );
  }

  return {
    transports,
    exceptionHandlers: loggingConfig.file.enabled
      ? [
          new winston.transports.File({
            filename: `${loggingConfig.file.path}/exceptions.log`,
            format: jsonFormat,
          }),
        ]
      : [],
    rejectionHandlers: loggingConfig.file.enabled
      ? [
          new winston.transports.File({
            filename: `${loggingConfig.file.path}/rejections.log`,
            format: jsonFormat,
          }),
        ]
      : [],
  };
}
