import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

export class UpdateCarDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  brand?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  color?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'License plate must contain only uppercase letters, numbers, and hyphens',
  })
  license_plate?: string;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}
