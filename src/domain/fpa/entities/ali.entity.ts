import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from '@domain/fpa/entities/base-fpa-component.entity';

export type ALIDocument = ALI & Document;

@Schema({ timestamps: true })
export class ALI extends BaseFPAComponent {
  @ApiProperty({ description: 'Number of record element types (RETs)' })
  @Prop({ required: true, min: 1 })
  recordElementTypes: number;

  @ApiProperty({ description: 'Number of data element types (DETs)' })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;
}

export const ALISchema = SchemaFactory.createForClass(ALI);
