import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum ComplexityLevel {
  LOW = 'LOW',
  AVERAGE = 'AVERAGE',
  HIGH = 'HIGH',
}

export class BaseFPAComponent {
  @ApiProperty({ description: 'The unique identifier of the component' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the component' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the component' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'The project this component belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @ApiProperty({ description: 'The complexity level of the component' })
  @Prop({
    type: String,
    enum: ComplexityLevel,
    default: ComplexityLevel.AVERAGE,
  })
  complexity: ComplexityLevel;

  @ApiProperty({ description: 'The functional points value of this component' })
  @Prop({ required: true })
  functionPoints: number;

  @ApiProperty({ description: 'The date when the component was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the component was last updated' })
  updatedAt: Date;
}
