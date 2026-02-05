import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CarsController } from './cars.controller';
import { CarsRepository } from './cars.repository';
import { CarsService } from './cars.service';

@Module({
  imports: [UsersModule],
  controllers: [CarsController],
  providers: [CarsService, CarsRepository],
  exports: [CarsService],
})
export class CarsModule {}
