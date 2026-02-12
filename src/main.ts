import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomLoggerService } from './common/logger/logger.service';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const customLogger = app.get(CustomLoggerService);
  const appConfig = configService.applicationConfig;
  const corsConfig = configService.corsConfig;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(customLogger));

  // Enable CORS based on configuration
  if (corsConfig.enabled) {
    app.enableCors({
      origin: corsConfig.origins === '*' ? true : corsConfig.origins.split(','),
      credentials: corsConfig.credentials,
    });
  }

  await app.listen(appConfig.port);

  customLogger.log(`Application started successfully`, 'Bootstrap', {
    name: appConfig.name,
    version: appConfig.version,
    port: appConfig.port,
    environment: appConfig.environment,
  });
}

// bootstrap(); is perfectly valid CommonJS/TypeScript code.
// The SonarQube rule S7785 simply prefers top‑level await when in an ES module environment.
// Since your project is not using ES modules, the warning is a false positive, it is safe to ignore.
bootstrap(); // NOSONAR
