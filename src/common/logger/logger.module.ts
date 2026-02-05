import { DynamicModule, Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigModule } from '../../config/config.module';
import { ConfigService } from '../../config/config.service';
import { createWinstonConfig } from './logger.config';
import { CustomLoggerService } from './logger.service';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        ConfigModule,
        WinstonModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return createWinstonConfig(configService);
          },
        }),
      ],
      providers: [CustomLoggerService],
      exports: [CustomLoggerService],
    };
  }
}
