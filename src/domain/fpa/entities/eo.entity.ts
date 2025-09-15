import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from './base-fpa-component.entity';

export type EODocument = EO & Document;

@Schema({ timestamps: true })
export class EO extends BaseFPAComponent {
  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Arquivos Referenciados',
    example: 3,
    minimum: 0,
  })
  @Prop({ required: true, min: 0 })
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Tipos de Dados',
    example: 25,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Output transaction',
    example:
      'Generates monthly customer statement with account balance, transaction history, and fees',
  })
  @Prop({ required: true })
  primaryIntent: string;

  @ApiProperty({
    description: 'Output format and data presentation details',
    example:
      'PDF format with email delivery, includes QR code for digital verification',
  })
  @Prop({ required: true })
  outputFormat: string;

  @ApiProperty({
    description:
      'Indicates whether this output produces derived data (calculations, totals, computed fields)',
    example: true,
  })
  @Prop({ required: true })
  derivedData: boolean;

  @ApiProperty({
    description:
      'Additional technical notes about output format, delivery method, or special requirements',
    required: false,
  })
  @Prop()
  notes?: string;
}

export const EOSchema = SchemaFactory.createForClass(EO);

// Add indexes for performance
EOSchema.index({ organizationId: 1 });
EOSchema.index({ projectId: 1 });
EOSchema.index({ organizationId: 1, projectId: 1 });
