import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from './base-fpa-component.entity';

export type EQDocument = EQ & Document;

@Schema({ timestamps: true })
export class EQ extends BaseFPAComponent {
  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Arquivos Referenciados',
    example: 2,
    minimum: 0,
  })
  @Prop({ required: true, min: 0 })
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Tipos de Dados',
    example: 18,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  // Special EQ calculation fields for input/output complexity separation
  @ApiProperty({
    description:
      'Number of File Types Referenced for input parameters (special EQ calculation)',
    example: 1,
    minimum: 0,
    required: false,
  })
  @Prop({ required: false, min: 0 })
  inputFtr?: number;

  @ApiProperty({
    description:
      'Number of Data Element Types for input parameters (special EQ calculation)',
    example: 5,
    minimum: 1,
    required: false,
  })
  @Prop({ required: false, min: 1 })
  inputDet?: number;

  @ApiProperty({
    description:
      'Number of File Types Referenced for output data (special EQ calculation)',
    example: 3,
    minimum: 0,
    required: false,
  })
  @Prop({ required: false, min: 0 })
  outputFtr?: number;

  @ApiProperty({
    description:
      'Number of Data Element Types for output data (special EQ calculation)',
    example: 12,
    minimum: 1,
    required: false,
  })
  @Prop({ required: false, min: 1 })
  outputDet?: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Query transaction',
    example:
      'Allows users to search and retrieve customer information by ID, name, or email',
  })
  @Prop({ required: true })
  primaryIntent: string;

  @ApiProperty({
    description: 'Search criteria and retrieval logic description',
    example:
      'Searches customer database using multiple criteria, applies security filters, returns formatted results',
  })
  @Prop({ required: true })
  retrievalLogic: string;

  @ApiProperty({
    description: 'Output format and data presentation details',
    example:
      'Returns customer details in JSON format with contact information, account status, and recent activity',
  })
  @Prop({ required: true })
  outputFormat: string;

  @ApiProperty({
    description:
      'Additional technical notes about query performance, caching, or special requirements',
    required: false,
  })
  @Prop()
  notes?: string;
}

export const EQSchema = SchemaFactory.createForClass(EQ);
