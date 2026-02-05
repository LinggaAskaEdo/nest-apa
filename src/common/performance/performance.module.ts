import { Global, Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PrometheusService } from './prometheus.service';

@Global()
@Module({
  providers: [PerformanceService, PrometheusService],
  exports: [PerformanceService, PrometheusService],
})
export class PerformanceModule {}
