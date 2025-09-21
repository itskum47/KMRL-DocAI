import { IsString, IsOptional, IsEnum, IsEmail, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User role' })
  @IsOptional()
  @IsEnum(['admin', 'hr', 'engineer', 'director', 'staff'])
  role?: string;

  @ApiPropertyOptional({ description: 'User department' })
  @IsOptional()
  @IsString()
  department?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'Filter by role' })
  @IsOptional()
  @IsEnum(['admin', 'hr', 'engineer', 'director', 'staff'])
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}