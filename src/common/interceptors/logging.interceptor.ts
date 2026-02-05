import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logger/logger.service';
import { PrometheusService } from '../performance/prometheus.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private logger: CustomLoggerService,
    private prometheusService: PrometheusService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, route } = request;

    // Skip logging for metrics endpoint
    if (url === '/metrics') {
      return next.handle();
    }

    const routePath = route?.path || url;
    const startTime = Date.now();

    this.prometheusService.incrementHttpInProgress(method, routePath);
    this.logger.logRequest(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.logResponse(request, response, responseTime);
          this.prometheusService.recordHttpRequest(
            method,
            routePath,
            statusCode,
            responseTime / 1000,
          );
          this.prometheusService.decrementHttpInProgress(method, routePath);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.prometheusService.recordHttpRequest(
            method,
            routePath,
            statusCode,
            responseTime / 1000,
          );
          this.prometheusService.decrementHttpInProgress(method, routePath);
        },
      }),
    );
  }
}
