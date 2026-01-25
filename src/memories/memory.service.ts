import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Memory } from './schemas/memory.schema';
import { Connection, Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { FileNamesDto, MemoryContentDto, MemoryDto } from './dto/memory.dto';
import { PaginationResponseDto } from './dto/pagination-response.dto';
import { MemoryResponseDto } from './dto/memory-response.dto';
import { PaginationDto } from './dto/pagination.dto';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { UpdateMemoryDto } from './dto/update-memory.dto';

@Injectable()
export class MemoryService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Memory.name)
    private readonly memoryModel: Model<Memory>,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createMemoryDto: MemoryDto,
    files: Array<Express.Multer.File>,
    userId: string,
  ): Promise<any> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const memoryContent: MemoryContentDto[] = [];
      const fileNames: FileNamesDto[] = [];
      files?.map((file) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        memoryContent.push({
          dateCreated: createMemoryDto.dateCreated,
          filePath: fileName,
          contentType: file.mimetype,
          description: createMemoryDto.description,
        });
        fileNames.push({
          fileObject: file,
          fileName: fileName,
        });
      });

      const memory = new this.memoryModel({
        title: createMemoryDto.title,
        description: createMemoryDto.description,
        tags: createMemoryDto.tags,
        familyMembers: createMemoryDto.familyMembers,
        memoryContent: memoryContent,
        userId: userId,
      });
      await memory.save({ session }).catch((error) => {
        if (error?.errorResponse?.code === 11000)
          throw new BadRequestException('Title already exists');
        throw new InternalServerErrorException(error);
      });

      await this.s3Service.uploadFiles(
        this.configService.get<string>('AWS_S3_BUCKET_NAME'),
        fileNames,
      );

      await session.commitTransaction();
      session.endSession();
      return memory;
    } catch (error) {
      await session.abortTransaction();

      session.endSession();
      throw error;
    }
  }

  async updateMemory(
    title: string,
    data: UpdateMemoryDto,
    files: Array<Express.Multer.File>,
  ): Promise<any> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const existingMemory = await this.memoryModel
        .findOne({ title: { $regex: title, $options: 'i' } })
        .session(session)
        .lean();

      if (!existingMemory) {
        throw new NotFoundException('Memory not found');
      }

      const memoryContent: MemoryContentDto[] = [];
      const fileNames: FileNamesDto[] = [];

      if (data?.deletedFiles && data.deletedFiles.length > 0) {
        const validDeletedFiles = data.deletedFiles.filter(
          (f: any) => typeof f === 'string' && f.trim(),
        );

        const deletedFileNames = validDeletedFiles.map((f) =>
          decodeURIComponent(f.split('/').pop() || ''),
        );

        const deletedSet = new Set(deletedFileNames.map((f) => f.trim()));

        existingMemory.memoryContent = existingMemory.memoryContent.filter(
          (mc) => !deletedSet.has(mc.filePath.trim()),
        );

        await this.s3Service.deleteFiles(
          this.configService.get<string>('AWS_S3_BUCKET_NAME'),
          deletedFileNames,
        );
      }

      files?.forEach((file) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        memoryContent.push({
          dateCreated: data.dateCreated,
          filePath: fileName,
          contentType: file.mimetype,
          description: data.description,
        });
        fileNames.push({
          fileObject: file,
          fileName: fileName,
        });
      });

      fileNames?.length &&
        (await this.s3Service.uploadFiles(
          this.configService.get<string>('AWS_S3_BUCKET_NAME'),
          fileNames,
        ));

      const updatedMemoryContent = [
        ...existingMemory.memoryContent,
        ...memoryContent,
      ];
      const savedData = {
        memoryContent: updatedMemoryContent,
        ...(existingMemory.title !== data.title && { title: data.title }),
        description: data.description,
        tags: data.tags,
        familyMembers: data.familyMembers,
      };
      const updated = await this.memoryModel
        .findOneAndUpdate(
          { title: { $regex: title, $options: 'i' } },
          {
            $set: savedData,
          },
          {
            new: true,
            session,
          },
        )
        .exec();

      await session.commitTransaction();
      session.endSession();

      return plainToInstance(MemoryResponseDto, updated.toObject());
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new BadRequestException('Title already exists');
      }
      throw error;
    }
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<MemoryResponseDto>> {
    const query = this.memoryModel.find();
    pagination?.perPage && query.limit(pagination.perPage);
    pagination?.currentPage &&
      query.skip((pagination.currentPage - 1) * pagination.perPage);

    const [data, total] = await Promise.all([
      query.lean().exec(),
      this.memoryModel.countDocuments().exec(),
    ]);
    const transformedData = await this.attachDownloadUrl(data);
    const result = {
      data: transformedData.map((item) =>
        plainToInstance(MemoryResponseDto, item),
      ),
      pages: Math.ceil(total / pagination?.perPage),
      total,
      currentPage: pagination?.currentPage || 1,
    };

    return result;
  }

  async findOne(title: string): Promise<MemoryResponseDto> {
    const result = await this.memoryModel
      .findOne({ title: { $regex: title, $options: 'i' } })
      .orFail()
      .lean()
      .catch(() => {
        throw new NotFoundException();
      });

    const [transformed] = await this.attachDownloadUrl([result]);
    return plainToInstance(MemoryResponseDto, transformed);
  }

  async delete(title: string): Promise<void> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const result = await this.memoryModel
        .findOneAndDelete(
          { title: { $regex: title, $options: 'i' } },
          { includeResultMetadata: true, session },
        )
        .exec();
      if (!result.value) {
        throw new NotFoundException('Memory not found');
      }
      const files =
        result.value &&
        result.value.memoryContent
          .map(({ filePath }) => filePath)
          .filter((file) => file);

      const deleted = await this.s3Service.deleteFiles(
        this.configService.get<string>('AWS_S3_BUCKET_NAME'),
        files,
      );
      if (!deleted && files.length > 0) {
        throw new BadRequestException('Failed to delete files from S3');
      }
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();

      session.endSession();
      throw error;
    }
  }

  private async attachDownloadUrl(results: any[]): Promise<any[]> {
    return Promise.all(
      results.map(async (result) => {
        const memoryFiles = result.memoryContent.map(
          (mc: { filePath: any }) => mc.filePath,
        );
        const s3Paths = await Promise.all(
          memoryFiles.map((filePath: string) =>
            this.s3Service.getDownloadUrl(
              this.configService.get<string>('AWS_S3_BUCKET_NAME'),
              filePath,
            ),
          ),
        );
        result.memoryContent.forEach((item: { filePath: any }, idx: number) => {
          item.filePath = s3Paths[idx];
        });
        return result;
      }),
    );
  }
}
