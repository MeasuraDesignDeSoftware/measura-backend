import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MetricDocument = Metric & Document;

export enum MetricType {
  QUANTITATIVE = 'quantitative',
  QUALITATIVE = 'qualitative',
  BINARY = 'binary',
}

export enum MetricUnit {
  COUNT = 'count',
  PERCENTAGE = 'percentage',
  TIME = 'time',
  CURRENCY = 'currency',
  SCORE = 'score',
  BOOLEAN = 'boolean',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true })
export class Metric {
  @ApiProperty({ description: 'The unique identifier of the metric' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the metric' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the metric' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'The ID of the question this metric is associated with',
  })
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @ApiProperty({
    description: 'The type of the metric',
    enum: MetricType,
    default: MetricType.QUANTITATIVE,
  })
  @Prop({
    type: String,
    enum: Object.values(MetricType),
    default: MetricType.QUANTITATIVE,
    required: true,
  })
  type: MetricType;

  @ApiProperty({
    description: 'The unit of measurement for the metric',
    enum: MetricUnit,
    default: MetricUnit.COUNT,
  })
  @Prop({
    type: String,
    enum: Object.values(MetricUnit),
    default: MetricUnit.COUNT,
    required: true,
  })
  unit: MetricUnit;

  @ApiProperty({ description: 'Custom unit label (used when unit is CUSTOM)' })
  @Prop()
  customUnitLabel?: string;

  @ApiProperty({
    description: 'The formula or method for collecting the metric',
  })
  @Prop()
  formula?: string;

  @ApiProperty({ description: 'The target or threshold value for this metric' })
  @Prop()
  targetValue?: number;

  @ApiProperty({
    description: 'The frequency of measurement (e.g., daily, weekly, monthly)',
  })
  @Prop()
  frequency?: string;

  @ApiProperty({ description: 'The ID of the user who created the metric' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'The date when the metric was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the metric was last updated' })
  updatedAt: Date;
}

export const MetricSchema = SchemaFactory.createForClass(Metric);
