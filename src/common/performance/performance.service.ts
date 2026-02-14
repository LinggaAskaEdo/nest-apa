import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../logger/logger.service';
import { getCorrelationId } from '../middleware/correlation-id.middleware';
import { PrometheusService } from './prometheus.service';

interface PerformanceTracker {
  correlationId: string;
  operation: string;
  startTime: number;
  metadata?: any;
}

@Injectable()
export class PerformanceService {
  private readonly trackers: Map<string, PerformanceTracker> = new Map();

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly prometheusService: PrometheusService,
  ) {}

  startTracking(operation: string, metadata?: any): string {
    const correlationId = getCorrelationId();
    const trackerId = `${correlationId}-${operation}-${Date.now()}`;

    this.trackers.set(trackerId, {
      correlationId,
      operation,
      startTime: Date.now(),
      metadata,
    });

    this.logger.debug(`Started tracking: ${operation}`, 'PerformanceService', {
      correlationId,
      operation,
      trackerId,
      ...metadata,
    });

    return trackerId;
  }

  stopTracking(trackerId: string, additionalMetadata?: any): number {
    const tracker = this.trackers.get(trackerId);

    if (!tracker) {
      this.logger.warn(`Tracker not found: ${trackerId}`, 'PerformanceService');
      return 0;
    }

    const duration = Date.now() - tracker.startTime;

    this.logger.log(`Completed: ${tracker.operation}`, 'PerformanceService', {
      correlationId: tracker.correlationId,
      operation: tracker.operation,
      duration: `${duration}ms`,
      ...tracker.metadata,
      ...additionalMetadata,
    });

    this.prometheusService.recordOperationDuration(tracker.operation, duration / 1000);

    this.trackers.delete(trackerId);

    return duration;
  }

  async trackOperation<T>(operation: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
    const trackerId = this.startTracking(operation, metadata);

    try {
      const result = await fn();
      this.stopTracking(trackerId, { success: true });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.stopTracking(trackerId, { success: false, error: errorMessage });

      throw error;
    }
  }
}
