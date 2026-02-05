import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SeederService } from '../seeder/seeder.service';
import { SchedulerService } from './scheduler.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SchedulerService, SeederService],
  exports: [SchedulerService, SeederService],
})
export class SchedulerModule {}
