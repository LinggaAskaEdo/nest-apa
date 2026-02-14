import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { CarsQueries } from '../../cars/sql/cars.queries';
import { ConfigService } from '../../config/config.service';
import { User } from '../../users/entities/user.entity';
import { UsersQueries } from '../../users/sql/users.queries';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../logger/logger.service';
import { PerformanceService } from '../performance/performance.service';

@Injectable()
export class SeederService {
  private readonly userCount: number;
  private readonly maxCarsPerUser: number;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: CustomLoggerService,
    private readonly performanceService: PerformanceService,
    private readonly configService: ConfigService,
  ) {
    const schedulerConfig = this.configService.schedulerConfig;
    this.userCount = schedulerConfig.dataSeeding.userCount;
    this.maxCarsPerUser = schedulerConfig.dataSeeding.maxCarsPerUser;
  }

  async seedData(): Promise<void> {
    return this.performanceService.trackOperation('seeder.seedData', async () => {
      try {
        const users: User[] = [];

        for (let i = 0; i < this.userCount; i++) {
          const userId = uuidv7();
          const email = faker.internet.email().toLowerCase();
          const name = faker.person.fullName();
          const age = faker.number.int({ min: 18, max: 70 });

          users.push({ id: userId, email, name, age });
        }

        await this.databaseService.transaction(async (client) => {
          for (const user of users) {
            await client.query(UsersQueries.create, [user.id, user.email, user.name, user.age]);
          }

          for (const user of users) {
            const carCount = faker.number.int({ min: 1, max: this.maxCarsPerUser });

            for (let j = 0; j < carCount; j++) {
              const carId = uuidv7();
              const brand = faker.vehicle.manufacturer();
              const model = faker.vehicle.model();
              const year = faker.number.int({ min: 2010, max: 2024 });
              const color = faker.vehicle.color();
              const licensePlate = faker.vehicle.vrm();

              await client.query(CarsQueries.create, [
                carId,
                user.id,
                brand,
                model,
                year,
                color,
                licensePlate,
              ]);
            }
          }
        });

        this.logger.log(`Seeded ${this.userCount} users with cars`, 'SeederService', {
          userCount: this.userCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error('Failed to seed data', errorStack, 'SeederService', {
          error: errorMessage,
        });
      }
    });
  }
}
