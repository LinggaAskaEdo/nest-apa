import { Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { Car } from '../cars/entities/car.entity';
import { DatabaseService } from '../common/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserWithCars } from './entities/user.entity';
import { UsersQueries } from './sql/users.queries';

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(queryDto: QueryUserDto): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC', ...filters } = queryDto;

    // Build dynamic WHERE clause
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (filters.name) {
      whereConditions.push(`name ILIKE $${paramCounter}`);
      values.push(`%${filters.name}%`);
      paramCounter++;
    }

    if (filters.email) {
      whereConditions.push(`email ILIKE $${paramCounter}`);
      values.push(`%${filters.email}%`);
      paramCounter++;
    }

    if (filters.minAge !== undefined) {
      whereConditions.push(`age >= $${paramCounter}`);
      values.push(filters.minAge);
      paramCounter++;
    }

    if (filters.maxAge !== undefined) {
      whereConditions.push(`age <= $${paramCounter}`);
      values.push(filters.maxAge);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

    const offset = (page - 1) * limit;
    const validSortColumns = ['id', 'name', 'email', 'created_at'];
    const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const safeOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const query = `
            ${UsersQueries.findAll}
            ${whereClause}
            ORDER BY ${safeSort} ${safeOrder}
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

    values.push(limit, offset);

    const countQuery = `
            ${UsersQueries.count}
            ${whereClause}
        `;

    const [usersResult, countResult] = await Promise.all([
      this.databaseService.query<User>(query, values),
      this.databaseService.query(countQuery, values.slice(0, -2)),
    ]);

    return {
      users: usersResult.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
    };
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.databaseService.query<User>(UsersQueries.findById, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return result.rows[0] || null;
  }

  async findByIdWithCars(id: string): Promise<UserWithCars> {
    const result = await this.databaseService.query<any>(UsersQueries.findByIdWithCars, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const row = result.rows[0];
    return {
      id: row.user_id,
      email: row.email,
      name: row.name,
      age: row.age,
      is_active: row.is_active,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
      cars: row.cars || [],
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.query<User>(UsersQueries.findByEmail, [email]);

    return result.rows[0] || null;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const id = uuidv7();

    const result = await this.databaseService.query<User>(UsersQueries.create, [
      id,
      createUserDto.email,
      createUserDto.name,
      createUserDto.age || null,
    ]);

    const user = result.rows[0];
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];
    let paramCounter = 1;

    if (updateUserDto.email !== undefined) {
      setClauses.push(`email = $${paramCounter}`);
      values.push(updateUserDto.email);
      paramCounter++;
    }

    if (updateUserDto.name !== undefined) {
      setClauses.push(`name = $${paramCounter}`);
      values.push(updateUserDto.name);
      paramCounter++;
    }

    if (updateUserDto.age !== undefined) {
      setClauses.push(`age = $${paramCounter}`);
      values.push(updateUserDto.age);
      paramCounter++;
    }

    if (updateUserDto.is_active !== undefined) {
      setClauses.push(`is_active = $${paramCounter}`);
      values.push(updateUserDto.is_active);
      paramCounter++;
    }

    values.push(id);

    const query = `
            ${UsersQueries.updateBase}, ${setClauses.join(', ')}
            WHERE id = $${paramCounter}
            RETURNING *
        `;

    const result = await this.databaseService.query<User>(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return result.rows[0] || null;
  }

  async delete(id: string): Promise<void> {
    const result = await this.databaseService.query(UsersQueries.delete, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async createMany(users: CreateUserDto[]): Promise<User[]> {
    return this.databaseService.transaction(async (client) => {
      const createdUsers: User[] = [];

      for (const user of users) {
        const id = uuidv7();
        const result = await client.query<User>(UsersQueries.create, [
          id,
          user.email,
          user.name,
          user.age || null,
        ]);

        const userRow = result.rows[0];
        if (!userRow?.id) {
          throw new Error(`Failed to create user with data: ${JSON.stringify(users)}`);
        }

        createdUsers.push(userRow);
      }

      return createdUsers;
    });
  }

  async createUserWithCars(
    userData: { email: string; name: string; age?: number },
    carsData: Array<{
      brand: string;
      model: string;
      year: number;
      color?: string;
      license_plate: string;
    }>,
  ): Promise<UserWithCars> {
    return this.databaseService.transaction(async (client) => {
      // Create user
      const userId = uuidv7();
      const userResult = await client.query<User>(UsersQueries.create, [
        userId,
        userData.email,
        userData.name,
        userData.age || null,
      ]);

      const userRow = userResult.rows[0];
      if (!userRow?.id || !userRow.email || !userRow.name) {
        throw new Error('Failed to create user - invalid data returned');
      }

      // Ensure all required fields are present
      const user: User = {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        age: userRow.age ?? (userData.age || 0),
        is_active: userRow.is_active ?? true,
        created_at: userRow.created_at ?? new Date(),
        updated_at: userRow.updated_at ?? new Date(),
      };

      // Create cars for this user
      const cars: Car[] = [];
      for (const carData of carsData) {
        const carId = uuidv7();
        const carResult = await client.query<Car>(
          `INSERT INTO cars (id, user_id, brand, model, year, color, license_plate)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            carId,
            userId,
            carData.brand,
            carData.model,
            carData.year,
            carData.color || null,
            carData.license_plate,
          ],
        );

        const carRow = carResult.rows[0];
        if (!carRow?.id) {
          throw new Error(`Failed to create car with data: ${JSON.stringify(carData)}`);
        }

        cars.push(carRow);
      }

      return {
        ...user,
        cars,
      };
    });
  }
}
