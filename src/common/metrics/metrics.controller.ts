import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusService } from '../performance/prometheus.service';

@Controller()
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}
