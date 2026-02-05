import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CarsModule } from './cars/cars.module';
import { DatabaseModule } from './common/database/database.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsController } from './common/metrics/metrics.controller';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { PerformanceModule } from './common/performance/performance.module';
import { SchedulerModule } from './common/scheduler/scheduler.module';
import { ConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot(), // Updated to use forRoot
    PerformanceModule,
    SchedulerModule,
    DatabaseModule,
    UsersModule,
    CarsModule,
  ],
  controllers: [MetricsController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
