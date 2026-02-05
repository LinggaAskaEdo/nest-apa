import { IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

export class CreateCarDto {
  @IsUUID('7')
  user_id!: string;

  @IsString()
  @Length(2, 100)
  brand!: string;

  @IsString()
  @Length(2, 100)
  model!: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  color?: string;

  @IsString()
  @Length(5, 20)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'License plate must contain only uppercase letters, numbers, and hyphens',
  })
  license_plate!: string;
}
