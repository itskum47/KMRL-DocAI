import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File content type' })
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ description: 'Document type' })
  @IsOptional()
  @IsEnum(['invoice', 'maintenance', 'circular', 'minutes', 'vendor'])
  docType?: string;
}

export class DocumentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['uploaded', 'processing', 'processed', 'failed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by document type' })
  @IsOptional()
  @IsEnum(['invoice', 'maintenance', 'circular', 'minutes', 'vendor'])
  docType?: string;

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