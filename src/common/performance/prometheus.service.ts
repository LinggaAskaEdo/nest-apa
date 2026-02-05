import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class PrometheusService {
  private registry: Registry;

  // HTTP Metrics
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private httpRequestsInProgress: Gauge;

  // Database Metrics
  private dbQueryDuration: Histogram;
  private dbQueriesTotal: Counter;

  // Business Operation Metrics
  private operationDuration: Histogram;
  private operationsTotal: Counter;

  // Active Connections
  private activeConnections: Gauge;

  constructor() {
    this.registry = new Registry();

    // HTTP Request Total
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // HTTP Request Duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // HTTP Requests In Progress
    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // Database Query Duration
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    // Database Queries Total
    this.dbQueriesTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    // Business Operation Duration
    this.operationDuration = new Histogram({
      name: 'operation_duration_seconds',
      help: 'Duration of business operations in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // Business Operations Total
    this.operationsTotal = new Counter({
      name: 'operations_total',
      help: 'Total number of business operations',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    // Active Connections
    this.activeConnections = new Gauge({
      name: 'db_active_connections',
      help: 'Number of active database connections',
      registers: [this.registry],
    });
  }

  // HTTP Metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
    this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
  }

  incrementHttpInProgress(method: string, route: string) {
    this.httpRequestsInProgress.labels(method, route).inc();
  }

  decrementHttpInProgress(method: string, route: string) {
    this.httpRequestsInProgress.labels(method, route).dec();
  }

  // Database Metrics
  recordDbQuery(operation: string, duration: number, success: boolean) {
    this.dbQueryDuration.labels(operation).observe(duration);
    this.dbQueriesTotal.labels(operation, success ? 'success' : 'error').inc();
  }

  // Business Operation Metrics
  recordOperationDuration(operation: string, duration: number) {
    this.operationDuration.labels(operation).observe(duration);
  }

  recordOperation(operation: string, success: boolean) {
    this.operationsTotal.labels(operation, success ? 'success' : 'error').inc();
  }

  // Connection Metrics
  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
