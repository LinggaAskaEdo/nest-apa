import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { getCorrelationId } from '../middleware/correlation-id.middleware';

@Injectable()
export class CustomLoggerService implements LoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  private enrichWithCorrelationId(metadata?: any) {
    return {
      correlationId: getCorrelationId(),
      ...metadata,
    };
  }

  log(message: string, context?: string, metadata?: any) {
    this.logger.info(message, {
      context,
      ...this.enrichWithCorrelationId(metadata),
    });
  }

  error(message: string, trace?: string, context?: string, metadata?: any) {
    this.logger.error(message, {
      context,
      trace,
      ...this.enrichWithCorrelationId(metadata),
    });
  }

  warn(message: string, context?: string, metadata?: any) {
    this.logger.warn(message, {
      context,
      ...this.enrichWithCorrelationId(metadata),
    });
  }

  debug(message: string, context?: string, metadata?: any) {
    this.logger.debug(message, {
      context,
      ...this.enrichWithCorrelationId(metadata),
    });
  }

  verbose(message: string, context?: string, metadata?: any) {
    this.logger.verbose(message, {
      context,
      ...this.enrichWithCorrelationId(metadata),
    });
  }

  logRequest(req: any) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      correlationId: req.correlationId || getCorrelationId(),
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  logResponse(req: any, res: any, responseTime: number) {
    this.logger.info('HTTP Response', {
      context: 'HTTP',
      correlationId: req.correlationId || getCorrelationId(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
    });
  }

  logQuery(query: string, params: any[], duration: number) {
    this.logger.debug('Database Query', {
      context: 'Database',
      correlationId: getCorrelationId(),
      query,
      params,
      duration: `${duration}ms`,
    });
  }

  logError(error: Error, context?: string, additionalInfo?: any) {
    this.logger.error('Error occurred', {
      context,
      correlationId: getCorrelationId(),
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      ...additionalInfo,
    });
  }
}
