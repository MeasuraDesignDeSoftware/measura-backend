import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @ApiProperty({ description: 'The unique identifier of the question' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The text of the question' })
  @Prop({ required: true })
  text: string;

  @ApiProperty({ description: 'The description or context of the question' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'The ID of the goal this question is associated with',
  })
  @Prop({ type: Types.ObjectId, ref: 'Goal', required: true })
  goalId: Types.ObjectId;

  @ApiProperty({
    description: 'The priority of the question (1-5, with 1 being highest)',
  })
  @Prop({ type: Number, min: 1, max: 5, default: 3 })
  priority: number;

  @ApiProperty({ description: 'The ID of the user who created the question' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'The date when the question was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the question was last updated' })
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
