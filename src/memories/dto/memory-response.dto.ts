import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Expose, Transform } from 'class-transformer';
import {
  IsDate,
  IsString,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { MemoryTypes } from '../types/memory-types';

export class MemoryContentResponseDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @Expose()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return new Date();
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  })
  dateCreated: Date = new Date();

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return '';
    return String(value);
  })
  filePath: string = '';

  @ApiProperty({ enum: MemoryTypes })
  @IsEnum(MemoryTypes)
  @Expose()
  contentType: string;

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return '';
    return String(value);
  })
  description: string = '';
}

export class MemoryResponseDto {
  @ApiProperty()
  @IsString()
  @Expose()
  @Transform(({ obj }) => obj._id?.toString() || '')
  id: string = '';

  @ApiProperty()
  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  })
  title: string = '';

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  })
  description: string = '';

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value;
  })
  tags: string[] = [];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @Expose()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value;
  })
  familyMembers: string[] = [];

  @ApiProperty({ type: [MemoryContentResponseDto] })
  @Type(() => MemoryContentResponseDto)
  @ValidateNested({ each: true })
  @Expose()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value;
  })
  memoryContent: MemoryContentResponseDto[] = [];
}
