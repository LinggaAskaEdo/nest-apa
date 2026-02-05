import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkTransferCarsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  car_ids!: string[];

  @IsUUID('7')
  from_user_id!: string;

  @IsUUID('7')
  to_user_id!: string;
}
