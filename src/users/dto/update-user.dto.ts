import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(150)
    age?: number;

    @IsOptional()
    @IsString()
    is_active?: boolean;
}