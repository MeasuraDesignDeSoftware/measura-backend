import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from './base-fpa-component.entity';

export type ALIDocument = ALI & Document;

@Schema({ timestamps: true })
export class ALI extends BaseFPAComponent {
  @ApiProperty({
    description:
      'Number of Record Element Types (RETs/TRs) - Tipos de Registro',
    example: 2,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Tipos de Dados',
    example: 15,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({
    description:
      'Primary purpose and business function of this Internal Logical File',
    example:
      'Stores customer information including contact details, preferences, and account status',
  })
  @Prop({ required: true })
  primaryIntent: string;

  @ApiProperty({
    description:
      'Additional technical notes about data structure, relationships, or constraints',
    required: false,
  })
  @Prop()
  notes?: string;
}

export const ALISchema = SchemaFactory.createForClass(ALI);
