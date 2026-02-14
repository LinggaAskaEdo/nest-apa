import { Injectable } from '@nestjs/common';
import { loadYamlConfig, YamlConfig } from './yaml-config.loader';

@Injectable()
export class ConfigService {
  private readonly config: YamlConfig;

  constructor() {
    this.config = loadYamlConfig();
  }

  // Get configuration value by path (dot notation), ex: get('database.host') or get('application.port')
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }

    return (value === undefined ? defaultValue : value) as T;
  }

  // Get string value
  getString(path: string, defaultValue?: string): string {
    return this.get<string>(path, defaultValue);
  }

  // Get number value
  getNumber(path: string, defaultValue?: number): number {
    const value = this.get(path, defaultValue);
    return typeof value === 'number' ? value : Number(value);
  }

  // Get boolean value
  getBoolean(path: string, defaultValue?: boolean): boolean {
    const value = this.get<any>(path, defaultValue as any);

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      return normalized === 'true' || normalized === '1';
    }

    if (value === undefined) {
      return defaultValue ?? false;
    }

    return Boolean(value);
  }

  // Get array value
  getArray<T = any>(path: string, defaultValue?: T[]): T[] {
    return this.get<T[]>(path, defaultValue);
  }

  // Check if configuration key exists
  has(path: string): boolean {
    return this.get(path) !== undefined;
  }

  // Get all configuration
  getAll(): YamlConfig {
    return this.config;
  }

  // Convenience getters for common configurations
  get applicationConfig() {
    return {
      name: this.getString('application.name', 'NestJS API'),
      version: this.getString('application.version', '1.0.0'),
      environment: this.getString('application.environment', 'development'),
      port: this.getNumber('application.port', 3000),
      metricsPort: this.getNumber('application.metricsPort', 9090),
    };
  }

  get databaseConfig() {
    return {
      host: this.getString('database.host', 'localhost'),
      port: this.getNumber('database.port', 5432),
      user: this.getString('database.username', 'postgres'),
      password: this.getString('database.password', ''),
      database: this.getString('database.database', 'nestjs_crud'),
      min: this.getNumber('database.pool.min', 2),
      max: this.getNumber('database.pool.max', 10),
      idleTimeoutMillis: this.getNumber('database.pool.idleTimeoutMillis', 30000),
      connectionTimeoutMillis: this.getNumber('database.pool.connectionTimeoutMillis', 2000),
    };
  }

  get loggingConfig() {
    return {
      level: this.getString('logging.level', 'info'),
      format: this.getString('logging.format', 'json'),
      file: {
        enabled: this.getBoolean('logging.file.enabled', true),
        path: this.getString('logging.file.path', 'logs'),
        maxSize: this.getNumber('logging.file.maxSize', 5242880),
        maxFiles: this.getNumber('logging.file.maxFiles', 5),
      },
    };
  }

  get schedulerConfig() {
    return {
      enabled: this.getBoolean('scheduler.enabled', true),
      dataSeeding: {
        enabled: this.getBoolean('scheduler.dataSeeding.enabled', true),
        interval: this.getNumber('scheduler.dataSeeding.interval', 30),
        userCount: this.getNumber('scheduler.dataSeeding.userCount', 5),
        maxCarsPerUser: this.getNumber('scheduler.dataSeeding.maxCarsPerUser', 50),
      },
    };
  }

  get corsConfig() {
    return {
      enabled: this.getBoolean('cors.enabled', true),
      origins: this.getString('cors.origins', '*'),
      credentials: this.getBoolean('cors.credentials', true),
    };
  }

  get metricsConfig() {
    return {
      enabled: this.getBoolean('metrics.enabled', true),
      path: this.getString('metrics.path', '/metrics'),
    };
  }

  get featuresConfig() {
    return {
      bulkOperations: this.getBoolean('features.bulkOperations', true),
      carTransfer: this.getBoolean('features.carTransfer', true),
      userRegistrationWithCars: this.getBoolean('features.userRegistrationWithCars', true),
    };
  }

  // Check if application is in production
  isProduction(): boolean {
    return this.getString('application.environment') === 'production';
  }

  // Check if application is in development
  isDevelopment(): boolean {
    return this.getString('application.environment') === 'development';
  }

  // Check if application is in test mode
  isTest(): boolean {
    return this.getString('application.environment') === 'test';
  }
}
