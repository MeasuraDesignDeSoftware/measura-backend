import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFPAComponent } from './base-fpa-component.entity';

export type AIEDocument = AIE & Document;

@Schema({ timestamps: true })
export class AIE extends BaseFPAComponent {
  @ApiProperty({
    description:
      'Number of Record Element Types (RETs/TRs) - Tipos de Registro',
    example: 1,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Tipos de Dados',
    example: 8,
    minimum: 1,
  })
  @Prop({ required: true, min: 1 })
  dataElementTypes: number;

  @ApiProperty({
    description:
      'Name or identifier of the external system that maintains this data',
    example: 'Payment Gateway API, Third-party CRM System',
  })
  @Prop({ required: true })
  externalSystem: string;

  @ApiProperty({
    description:
      'Primary purpose and business function of this External Interface File',
    example:
      'Provides access to external customer credit rating information for loan processing',
  })
  @Prop({ required: true })
  primaryIntent: string;

  @ApiProperty({
    description:
      'Additional technical notes about the external interface, data format, or access method',
    required: false,
  })
  @Prop()
  notes?: string;
}

export const AIESchema = SchemaFactory.createForClass(AIE);

// Add indexes for performance
AIESchema.index({ organizationId: 1 });
AIESchema.index({ projectId: 1 });
AIESchema.index({ organizationId: 1, projectId: 1 });
