import { IsUUID } from 'class-validator';

export class TransferCarDto {
  @IsUUID('7')
  car_id!: string;

  @IsUUID('7')
  from_user_id!: string;

  @IsUUID('7')
  to_user_id!: string;
}
