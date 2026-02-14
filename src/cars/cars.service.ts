import { ConflictException, Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../common/logger/logger.service';
import { PerformanceService } from '../common/performance/performance.service';
import { UsersService } from '../users/users.service';
import { CarsRepository } from './cars.repository';
import { BulkTransferCarsDto } from './dto/bulk-transfer-cars.dto';
import { CreateCarDto } from './dto/create-car.dto';
import { QueryCarDto } from './dto/query-car.dto';
import { TransferCarDto } from './dto/transfer-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Car, CarWithUser } from './entities/car.entity';

@Injectable()
export class CarsService {
  constructor(
    private readonly carsRepository: CarsRepository,
    private readonly usersService: UsersService,
    private readonly logger: CustomLoggerService,
    private readonly performanceService: PerformanceService,
  ) {}

  async findAll(queryDto: QueryCarDto) {
    return this.carsRepository.findAll(queryDto);
  }

  async findOne(id: string): Promise<CarWithUser> {
    return this.carsRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<CarWithUser[]> {
    // Verify user exists
    await this.usersService.findOne(userId);
    return this.carsRepository.findByUserId(userId);
  }

  async create(createCarDto: CreateCarDto): Promise<Car> {
    // Verify user exists
    await this.usersService.findOne(createCarDto.user_id);

    // Check if license plate already exists
    const existingCar = await this.carsRepository.findByLicensePlate(createCarDto.license_plate);
    if (existingCar) {
      throw new ConflictException('License plate already exists');
    }

    return this.carsRepository.create(createCarDto);
  }

  async update(id: string, updateCarDto: UpdateCarDto): Promise<Car> {
    // If updating license plate, check if it's already taken
    if (updateCarDto.license_plate) {
      const existingCar = await this.carsRepository.findByLicensePlate(updateCarDto.license_plate);
      if (existingCar && existingCar.id !== id) {
        throw new ConflictException('License plate already exists');
      }
    }

    return this.carsRepository.update(id, updateCarDto);
  }

  async remove(id: string): Promise<void> {
    return this.carsRepository.delete(id);
  }

  async createMany(cars: CreateCarDto[]): Promise<Car[]> {
    // Verify all users exist
    const userIds = [...new Set(cars.map((car) => car.user_id))];
    for (const userId of userIds) {
      await this.usersService.findOne(userId);
    }

    return this.carsRepository.createMany(cars);
  }

  async getStatsByUser(userId: string): Promise<any> {
    // Verify user exists
    await this.usersService.findOne(userId);
    return this.carsRepository.getCarStatsByUser(userId);
  }

  async search(searchTerm: string): Promise<CarWithUser[]> {
    return this.carsRepository.searchWithUserDetails(searchTerm);
  }

  async transferOwnership(transferDto: TransferCarDto): Promise<Car> {
    return this.performanceService.trackOperation(
      'cars.transferOwnership',
      async () => {
        // Verify both users exist
        await this.usersService.findOne(transferDto.from_user_id);
        await this.usersService.findOne(transferDto.to_user_id);

        this.logger.log('Transferring car ownership', 'CarsService', {
          carId: transferDto.car_id,
          fromUserId: transferDto.from_user_id,
          toUserId: transferDto.to_user_id,
        });

        const car = await this.carsRepository.transferOwnership(
          transferDto.car_id,
          transferDto.from_user_id,
          transferDto.to_user_id,
        );

        this.logger.log('Car ownership transferred successfully', 'CarsService', {
          carId: car.id,
          newOwnerId: car.user_id,
        });

        return car;
      },
      { carId: transferDto.car_id },
    );
  }

  async bulkTransferOwnership(bulkTransferDto: BulkTransferCarsDto): Promise<Car[]> {
    return this.performanceService.trackOperation(
      'cars.bulkTransferOwnership',
      async () => {
        // Verify both users exist
        await this.usersService.findOne(bulkTransferDto.from_user_id);
        await this.usersService.findOne(bulkTransferDto.to_user_id);

        this.logger.log('Bulk transferring car ownership', 'CarsService', {
          carCount: bulkTransferDto.car_ids.length,
          fromUserId: bulkTransferDto.from_user_id,
          toUserId: bulkTransferDto.to_user_id,
        });

        const cars = await this.carsRepository.bulkTransferOwnership(
          bulkTransferDto.car_ids,
          bulkTransferDto.from_user_id,
          bulkTransferDto.to_user_id,
        );

        this.logger.log('Bulk car ownership transfer completed', 'CarsService', {
          transferredCount: cars.length,
        });

        return cars;
      },
      { carCount: bulkTransferDto.car_ids.length },
    );
  }
}
