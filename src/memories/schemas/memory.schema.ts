import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MemoryTypes } from '../types/memory-types';

export type MemoryDocument = HydratedDocument<Memory>;

@Schema()
export class MemoryContent {
  @Prop({ required: true })
  dateCreated: Date;

  @Prop({ required: true })
  filePath: string;

  @Prop({ enum: MemoryTypes })
  contentType: string;

  @Prop()
  description: string;
}

@Schema()
export class Memory {
  @Prop({ required: true, unique: true, index: true })
  title: string;

  @Prop()
  description: string;

  @Prop([String])
  tags: string[];

  @Prop([String])
  familyMembers: string[];

  @Prop({ type: [MemoryContent], default: [] })
  memoryContent: MemoryContent[];

  @Prop({ required: true })
  userId: string;
}

export const MemorySchema = SchemaFactory.createForClass(Memory);
