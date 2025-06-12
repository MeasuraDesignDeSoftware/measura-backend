import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GoalDocument = Goal & Document;

export enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ timestamps: true })
export class Goal {
  @ApiProperty({ description: 'The unique identifier of the goal' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the goal' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the goal' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'The ID of the user who created the goal' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'The status of the goal' })
  @Prop({ type: String, enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @ApiProperty({ description: 'The date when the goal was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the goal was last updated' })
  updatedAt: Date;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
