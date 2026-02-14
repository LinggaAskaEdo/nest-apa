import { ConflictException, Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../common/logger/logger.service';
import { PerformanceService } from '../common/performance/performance.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { RegisterUserWithCarsDto } from './dto/register-user-with-cars.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserWithCars } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: CustomLoggerService,
    private readonly performanceService: PerformanceService,
  ) {}

  async findAll(queryDto: QueryUserDto) {
    return this.usersRepository.findAll(queryDto);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.usersRepository.create(createUserDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // If updating email, check if it's already taken
    if (updateUserDto.email) {
      const existingUser = await this.usersRepository.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const result = await this.usersRepository.update(id, updateUserDto);
    if (!result) {
      throw new Error(`Failed to update user with data: ${JSON.stringify(updateUserDto)}`);
    }

    return result;
  }

  async remove(id: string): Promise<void> {
    return this.usersRepository.delete(id);
  }

  async createMany(users: CreateUserDto[]): Promise<User[]> {
    return this.usersRepository.createMany(users);
  }

  async registerUserWithCars(registerDto: RegisterUserWithCarsDto): Promise<UserWithCars> {
    return this.performanceService.trackOperation(
      'users.registerUserWithCars',
      async () => {
        // Check if email already exists
        const existingUser = await this.usersRepository.findByEmail(registerDto.email);
        if (existingUser) {
          this.logger.warn('User registration failed - email already exists', 'UsersService', {
            email: registerDto.email,
          });
          throw new ConflictException('Email already exists');
        }

        this.logger.log('Registering user with cars', 'UsersService', {
          email: registerDto.email,
          carCount: registerDto.cars.length,
        });

        // Create user data object
        const userData: { email: string; name: string; age?: number } = {
          email: registerDto.email,
          name: registerDto.name,
        };

        // Only add age if it's defined
        if (registerDto.age !== undefined) {
          userData.age = registerDto.age;
        }

        const user = await this.usersRepository.createUserWithCars(userData, registerDto.cars);

        this.logger.log('User registered with cars successfully', 'UsersService', {
          userId: user.id,
          carCount: registerDto.cars.length,
        });

        return user;
      },
      { email: registerDto.email, carCount: registerDto.cars.length },
    );
  }
}
