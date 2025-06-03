import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from '@domain/fpa/entities/base-fpa-component.entity';

export type EQDocument = EQ & Document;

@Schema({ timestamps: true })
export class EQ extends BaseFPAComponent {
  @ApiProperty({ description: 'Number of file types referenced (FTRs)' })
  @Prop({ required: true, min: 0 })
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of data element types in input part (DETs)',
  })
  @Prop({ required: true, min: 1 })
  inputDataElementTypes: number;

  @ApiProperty({
    description: 'Number of data element types in output part (DETs)',
  })
  @Prop({ required: true, min: 1 })
  outputDataElementTypes: number;
}

export const EQSchema = SchemaFactory.createForClass(EQ);
