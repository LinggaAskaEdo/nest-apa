import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { ConfigService } from '../../config/config.service';
import { CustomLoggerService } from '../logger/logger.service';
import { PrometheusService } from '../performance/prometheus.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly prometheusService: PrometheusService,
  ) {}

  async onModuleInit() {
    const config = this.configService.databaseConfig;

    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      min: config.min,
      max: config.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err: any) => {
      this.logger.error('Unexpected pool error', err.stack, 'DatabaseService', {
        errorCode: err.code,
      });
    });

    this.pool.on('connect', () => {
      this.updateConnectionMetrics();
    });

    this.pool.on('remove', () => {
      this.updateConnectionMetrics();
    });

    this.logger.log('Database connection pool initialized', 'DatabaseService', {
      host: config.host,
      database: config.database,
      poolMin: config.min,
      poolMax: config.max,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Database connection pool closed');
  }

  private updateConnectionMetrics() {
    const totalCount = this.pool.totalCount;
    const idleCount = this.pool.idleCount;
    const activeCount = totalCount - idleCount;

    this.prometheusService.setActiveConnections(activeCount);
  }

  // Execute parameterized query
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    const operation = this.extractOperation(text);

    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      this.logger.logQuery(text, params || [], duration);
      this.prometheusService.recordDbQuery(operation, duration / 1000, true);

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      // Convert unknown error to Error instance
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.logError(err, 'DatabaseService', {
        query: text,
        params: params || [],
      });

      this.prometheusService.recordDbQuery(operation, duration / 1000, false);

      throw error;
    }
  }

  // Get client for transactions
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // Execute transaction
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    const start = Date.now();

    try {
      await client.query('BEGIN');
      this.logger.debug('Transaction started', 'DatabaseService');

      const result = await callback(client);

      await client.query('COMMIT');
      const duration = Date.now() - start;

      this.logger.debug('Transaction committed', 'DatabaseService', {
        duration: `${duration}ms`,
      });

      this.prometheusService.recordDbQuery('TRANSACTION', duration / 1000, true);

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      const duration = Date.now() - start;

      // Handle unknown error safely
      if (error instanceof Error) {
        this.logger.error('Transaction rolled back', error.stack, 'DatabaseService');
      } else {
        this.logger.error('Transaction rolled back', undefined, 'DatabaseService', {
          error: String(error),
        });
      }

      this.prometheusService.recordDbQuery('TRANSACTION', duration / 1000, false);

      throw error;
    } finally {
      client.release();
      this.updateConnectionMetrics();
    }
  }

  private extractOperation(query: string): string {
    const normalized = query.trim().toUpperCase();
    if (normalized.startsWith('SELECT')) return 'SELECT';
    if (normalized.startsWith('INSERT')) return 'INSERT';
    if (normalized.startsWith('UPDATE')) return 'UPDATE';
    if (normalized.startsWith('DELETE')) return 'DELETE';

    return 'OTHER';
  }
}
