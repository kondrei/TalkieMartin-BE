import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose, Transform } from 'class-transformer';
import {
  IsDate,
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class MemoryDto {
  @ApiProperty({ default: '' })
  @IsString()
  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => value?.trim())
  description: string = '';

  @ApiProperty({ default: new Date().toISOString() })
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

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  tags: string[] = [];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  familyMembers: string[] = [];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: true,
    description: 'Upload up to 5 files',
  })
  files: Array<Express.Multer.File>;
}

export class MemoryContentDto {
  dateCreated: Date = new Date();

  filePath: string = '';

  contentType: string;

  description: string = '';
}

export class FileNamesDto {
  fileObject: Express.Multer.File;
  fileName: string;
}
