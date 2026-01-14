import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { MemoryDto } from './memory.dto';

export class UpdateMemoryDto extends MemoryDto {
  @ApiPropertyOptional({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  deletedFiles: string[] = [];
}
