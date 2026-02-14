import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '../../config/config.service';
import { CustomLoggerService } from '../logger/logger.service';
import { SeederService } from '../seeder/seeder.service';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly schedulerEnabled: boolean;
  private readonly dataSeedingEnabled: boolean;
  private readonly dataSeedingInterval: number;

  constructor(
    private readonly seederService: SeederService,
    private readonly logger: CustomLoggerService,
    private readonly configService: ConfigService,
  ) {
    const schedulerConfig = this.configService.schedulerConfig;
    this.schedulerEnabled = schedulerConfig.enabled;
    this.dataSeedingEnabled = schedulerConfig.dataSeeding.enabled;
    this.dataSeedingInterval = schedulerConfig.dataSeeding.interval;

    this.logger.log('Scheduler initialized', 'SchedulerService', {
      enabled: this.schedulerEnabled,
      dataSeedingEnabled: this.dataSeedingEnabled,
      interval: this.dataSeedingInterval,
    });
  }

  // Run every 30 seconds
  @Cron('*/30 * * * * *')
  async handleDataSeed() {
    if (!this.schedulerEnabled || !this.dataSeedingEnabled) {
      return;
    }

    this.logger.log('Running scheduled data seeding', 'SchedulerService');
    await this.seederService.seedData();
  }

  // Run at startup
  async onApplicationBootstrap() {
    if (!this.schedulerEnabled || !this.dataSeedingEnabled) {
      return;
    }

    this.logger.log('Seeding initial data on startup', 'SchedulerService');
    await this.seederService.seedData();
  }
}
