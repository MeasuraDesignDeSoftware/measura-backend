import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from './base-fpa-component.entity';

export type EIDocument = EI & Document;

@Schema({ timestamps: true })
export class EI extends BaseFPAComponent {
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
    example: 12,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Input transaction',
    example:
      'Allows users to create new customer records with validation and duplicate checking',
  })
  @Prop({ required: true })
  primaryIntent: string;

  @ApiProperty({
    description:
      'Processing logic description - what business rules, calculations, or validations are performed',
    example:
      'Validates email format, checks for duplicate customers, assigns customer ID, sends welcome email',
  })
  @Prop({ required: true })
  processingLogic: string;

  @ApiProperty({
    description:
      'Additional technical notes about input validation, error handling, or special requirements',
    required: false,
  })
  @Prop()
  notes?: string;
}

export const EISchema = SchemaFactory.createForClass(EI);

// Add indexes for performance
EISchema.index({ organizationId: 1 });
EISchema.index({ projectId: 1 });
EISchema.index({ organizationId: 1, projectId: 1 });
