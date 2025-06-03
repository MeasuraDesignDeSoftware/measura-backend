import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from '@domain/fpa/entities/base-fpa-component.entity';

export type EODocument = EO & Document;

@Schema({ timestamps: true })
export class EO extends BaseFPAComponent {
  @ApiProperty({ description: 'Number of file types referenced (FTRs)' })
  @Prop({ required: true, min: 0 })
  fileTypesReferenced: number;

  @ApiProperty({ description: 'Number of data element types (DETs)' })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({
    description:
      'Indicates if additional processing beyond direct retrieval is included',
  })
  @Prop({ default: false })
  hasAdditionalProcessing: boolean;
}

export const EOSchema = SchemaFactory.createForClass(EO);
