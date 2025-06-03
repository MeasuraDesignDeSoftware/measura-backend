import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from '@domain/fpa/entities/base-fpa-component.entity';

export type EIDocument = EI & Document;

@Schema({ timestamps: true })
export class EI extends BaseFPAComponent {
  @ApiProperty({ description: 'Number of file types referenced (FTRs)' })
  @Prop({ required: true, min: 0 })
  fileTypesReferenced: number;

  @ApiProperty({ description: 'Number of data element types (DETs)' })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({ description: 'Primary intent of this external input' })
  @Prop({ required: true })
  primaryIntent: string;
}

export const EISchema = SchemaFactory.createForClass(EI);
