import { Injectable, NotFoundException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { CreateCarDto } from './dto/create-car.dto';
import { QueryCarDto } from './dto/query-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Car, CarWithUser } from './entities/car.entity';
import { CarsQueries } from './sql/cars.queries';

@Injectable()
export class CarsRepository {
  constructor(private databaseService: DatabaseService) {}

  async findAll(queryDto: QueryCarDto): Promise<{ cars: CarWithUser[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC', ...filters } = queryDto;

    // Build dynamic WHERE clause
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (filters.user_id !== undefined) {
      whereConditions.push(`c.user_id = $${paramCounter}`);
      values.push(filters.user_id);
      paramCounter++;
    }

    if (filters.brand) {
      whereConditions.push(`c.brand ILIKE $${paramCounter}`);
      values.push(`%${filters.brand}%`);
      paramCounter++;
    }

    if (filters.model) {
      whereConditions.push(`c.model ILIKE $${paramCounter}`);
      values.push(`%${filters.model}%`);
      paramCounter++;
    }

    if (filters.color) {
      whereConditions.push(`c.color ILIKE $${paramCounter}`);
      values.push(`%${filters.color}%`);
      paramCounter++;
    }

    if (filters.minYear !== undefined) {
      whereConditions.push(`c.year >= $${paramCounter}`);
      values.push(filters.minYear);
      paramCounter++;
    }

    if (filters.maxYear !== undefined) {
      whereConditions.push(`c.year <= $${paramCounter}`);
      values.push(filters.maxYear);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

    const offset = (page - 1) * limit;
    const validSortColumns = ['id', 'brand', 'model', 'year', 'created_at'];
    const safeSort = validSortColumns.includes(sortBy) ? `c.${sortBy}` : 'c.id';
    const safeOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const query = `
            ${CarsQueries.findAll}
            ${whereClause}
            ORDER BY ${safeSort} ${safeOrder}
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

    values.push(limit, offset);

    const countQuery = `
            ${CarsQueries.count}
            ${whereClause}
        `;

    const [carsResult, countResult] = await Promise.all([
      this.databaseService.query<CarWithUser>(query, values),
      this.databaseService.query(countQuery, values.slice(0, -2)),
    ]);

    return {
      cars: carsResult.rows,
      total: parseInt(countResult.rows[0]?.total ?? '0', 10),
    };
  }

  async findById(id: string): Promise<CarWithUser> {
    const result = await this.databaseService.query<CarWithUser>(CarsQueries.findById, [id]);

    const car = result.rows[0];
    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    return car;
  }

  async findByUserId(userId: string): Promise<CarWithUser[]> {
    const result = await this.databaseService.query<CarWithUser>(CarsQueries.findByUserId, [
      userId,
    ]);

    return result.rows;
  }

  async findByLicensePlate(licensePlate: string): Promise<Car | null> {
    const result = await this.databaseService.query<Car>(CarsQueries.findByLicensePlate, [
      licensePlate,
    ]);

    const car = result.rows[0];
    if (!car) {
      throw new NotFoundException(`Car with plate ${licensePlate} not found`);
    }

    return car;
  }

  async create(createCarDto: CreateCarDto): Promise<Car> {
    const id = uuidv7(); // Generate UUID v7

    const result = await this.databaseService.query<Car>(CarsQueries.create, [
      id,
      createCarDto.user_id,
      createCarDto.brand,
      createCarDto.model,
      createCarDto.year,
      createCarDto.color || null,
      createCarDto.license_plate,
    ]);

    const car = result.rows[0];
    if (!car) {
      throw new Error(`Failed to create car with data: ${JSON.stringify(createCarDto)}`);
    }

    return car;
  }

  async update(id: string, updateCarDto: UpdateCarDto): Promise<Car> {
    const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];
    let paramCounter = 1;

    if (updateCarDto.brand !== undefined) {
      setClauses.push(`brand = $${paramCounter}`);
      values.push(updateCarDto.brand);
      paramCounter++;
    }

    if (updateCarDto.model !== undefined) {
      setClauses.push(`model = $${paramCounter}`);
      values.push(updateCarDto.model);
      paramCounter++;
    }

    if (updateCarDto.year !== undefined) {
      setClauses.push(`year = $${paramCounter}`);
      values.push(updateCarDto.year);
      paramCounter++;
    }

    if (updateCarDto.color !== undefined) {
      setClauses.push(`color = $${paramCounter}`);
      values.push(updateCarDto.color);
      paramCounter++;
    }

    if (updateCarDto.license_plate !== undefined) {
      setClauses.push(`license_plate = $${paramCounter}`);
      values.push(updateCarDto.license_plate);
      paramCounter++;
    }

    if (updateCarDto.is_available !== undefined) {
      setClauses.push(`is_available = $${paramCounter}`);
      values.push(updateCarDto.is_available);
      paramCounter++;
    }

    values.push(id);

    const query = `
            ${CarsQueries.updateBase}, ${setClauses.join(', ')}
            WHERE id = $${paramCounter}
            RETURNING *
        `;

    const result = await this.databaseService.query<Car>(query, values);

    const car = result.rows[0];
    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }

    return car;
  }

  async delete(id: string): Promise<void> {
    const result = await this.databaseService.query(CarsQueries.delete, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.databaseService.query(CarsQueries.deleteByUserId, [userId]);

    return result.rowCount ?? 0;
  }

  async createMany(cars: CreateCarDto[]): Promise<Car[]> {
    return this.databaseService.transaction(async (client) => {
      const createdCars: Car[] = [];

      for (const car of cars) {
        const id = uuidv7();
        const result = await client.query<Car>(CarsQueries.bulkInsert, [
          id,
          car.user_id,
          car.brand,
          car.model,
          car.year,
          car.color || null,
          car.license_plate,
        ]);

        const createdCar = result.rows[0];
        if (!createdCar) {
          throw new Error(`Failed to create car with license plate: ${car.license_plate}`);
        }

        createdCars.push(createdCar);
      }

      return createdCars;
    });
  }

  async getCarStatsByUser(userId: string): Promise<any> {
    const result = await this.databaseService.query(CarsQueries.getStatsByUser, [userId]);

    return result.rows[0];
  }

  async searchWithUserDetails(searchTerm: string): Promise<CarWithUser[]> {
    const result = await this.databaseService.query<CarWithUser>(CarsQueries.search, [
      `%${searchTerm}%`,
    ]);

    return result.rows;
  }

  async transferOwnership(carId: string, fromUserId: string, toUserId: string): Promise<Car> {
    const result = await this.databaseService.query<Car>(CarsQueries.transferOwnership, [
      toUserId,
      carId,
      fromUserId,
    ]);

    const car = result.rows[0];
    if (!car) {
      throw new NotFoundException(
        `Car with ID ${carId} not found or doesn't belong to user ${fromUserId}`,
      );
    }

    return car;
  }

  async verifyOwnership(carId: string, userId: string): Promise<boolean> {
    const result = await this.databaseService.query(CarsQueries.verifyOwnership, [carId, userId]);

    return result.rows.length > 0;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.databaseService.query(CarsQueries.countByUser, [userId]);

    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async bulkTransferOwnership(
    carIds: string[],
    fromUserId: string,
    toUserId: string,
  ): Promise<Car[]> {
    return this.databaseService.transaction(async (client) => {
      const transferredCars: Car[] = [];

      for (const carId of carIds) {
        // Verify ownership first
        const verifyResult = await client.query(CarsQueries.verifyOwnership, [carId, fromUserId]);

        if (verifyResult.rows.length === 0) {
          throw new NotFoundException(
            `Car ${carId} not found or doesn't belong to user ${fromUserId}`,
          );
        }

        // Transfer ownership
        const result = await client.query<Car>(CarsQueries.transferOwnership, [
          toUserId,
          carId,
          fromUserId,
        ]);

        const transferredCar = result.rows[0];
        if (!transferredCar) {
          throw new Error(`Failed to transfer car ${carId}`);
        }

        transferredCars.push(transferredCar);
      }

      return transferredCars;
    });
  }
}
