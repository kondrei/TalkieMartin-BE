import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MemoryService } from './memory.service';
import { MemoryParamDto } from './dto/memory-params.dto';
import { MemoryDto } from './dto/memory.dto';
import { PaginationResponseDto } from './dto/pagination-response.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MemoryResponseDto } from './dto/memory-response.dto';
import { FilePipe } from '../pipes/file-validation.pipe';
import { plainToInstance } from 'class-transformer';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { PaginationDto } from './dto/pagination.dto';
import { MemoryMimeTypes } from './types/memory-types';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../decorators/user.decorator';

@ApiTags('Family Memories')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiExtraModels(PaginationResponseDto, MemoryDto)
@Controller('memories')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all family memories.' })
  async getMemoryList(
    @Query() param: PaginationDto,
  ): Promise<PaginationResponseDto<MemoryResponseDto>> {
    const paginationParam = plainToInstance(PaginationDto, param);
    return await this.memoryService.findAll(paginationParam);
  }

  @ApiOperation({ summary: 'Get one memory by title.' })
  @Get(':title')
  async findMemory(@Param() params: MemoryParamDto) {
    const memory = this.memoryService.findOne(params.title);
    return memory;
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Add a new family memory',
  })
  @ApiBody({ type: MemoryDto })
  async addMemory(
    @Body() memory: MemoryDto,
    @UploadedFiles(new FilePipe(MemoryMimeTypes))
    files: Array<Express.Multer.File>,
    @User() user: any,
  ) {
    const result = await this.memoryService.create(memory, files, user.sub);
    return plainToInstance(MemoryResponseDto, result.toObject());
  }

  @Put(':title')
  @ApiOperation({
    summary: 'Update a family memory',
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  async updateMemory(
    @Param() param: MemoryParamDto,
    @Body() memoryData: UpdateMemoryDto,
    @UploadedFiles(new FilePipe(MemoryMimeTypes))
    files: Array<Express.Multer.File>,
  ) {
    return this.memoryService.updateMemory(param.title, memoryData, files);
  }

  @Delete(':title')
  @ApiOperation({
    summary: 'Delete a family memory and all associated files',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMemory(@Param() params: MemoryParamDto) {
    return await this.memoryService.delete(params.title);
  }
}
