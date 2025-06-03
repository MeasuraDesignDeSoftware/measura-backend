import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from '@domain/fpa/entities/base-fpa-component.entity';

export type AIEDocument = AIE & Document;

@Schema({ timestamps: true })
export class AIE extends BaseFPAComponent {
  @ApiProperty({ description: 'Number of record element types (RETs)' })
  @Prop({ required: true, min: 1 })
  recordElementTypes: number;

  @ApiProperty({ description: 'Number of data element types (DETs)' })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({ description: 'Reference to external system or application' })
  @Prop({ required: true })
  externalSystem: string;
}

export const AIESchema = SchemaFactory.createForClass(AIE);
