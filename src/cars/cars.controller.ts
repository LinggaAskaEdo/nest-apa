import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { BulkTransferCarsDto } from './dto/bulk-transfer-cars.dto';
import { CreateCarDto } from './dto/create-car.dto';
import { QueryCarDto } from './dto/query-car.dto';
import { TransferCarDto } from './dto/transfer-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  async findAll(@Query() queryDto: QueryCarDto) {
    return this.carsService.findAll(queryDto);
  }

  @Get('search/:term')
  async search(@Param('term') term: string) {
    return this.carsService.search(term);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.carsService.findByUserId(userId);
  }

  @Get('user/:userId/stats')
  async getStatsByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.carsService.getStatsByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createMany(@Body() cars: CreateCarDto[]) {
    return this.carsService.createMany(cars);
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCarDto: UpdateCarDto) {
    return this.carsService.update(id, updateCarDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.remove(id);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transferOwnership(@Body() transferDto: TransferCarDto) {
    return this.carsService.transferOwnership(transferDto);
  }

  @Post('transfer/bulk')
  @HttpCode(HttpStatus.OK)
  async bulkTransferOwnership(@Body() bulkTransferDto: BulkTransferCarsDto) {
    return this.carsService.bulkTransferOwnership(bulkTransferDto);
  }
}
