import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(150)
  age?: number;
}
