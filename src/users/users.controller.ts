import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { RegisterUserWithCarsDto } from './dto/register-user-with-cars.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(@Query() queryDto: QueryUserDto) {
        return this.usersService.findAll(queryDto);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    async createMany(@Body() users: CreateUserDto[]) {
        return this.usersService.createMany(users);
    }

    @Put(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.remove(id);
    }

    @Post('register-with-cars')
    @HttpCode(HttpStatus.CREATED)
    async registerWithCars(@Body() registerDto: RegisterUserWithCarsDto) {
        return this.usersService.registerUserWithCars(registerDto);
    }
}