import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ timestamps: true })
export class Project {
  @ApiProperty({ description: 'The unique identifier of the project' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the project' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the project' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'The ID of the user who created the project' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'The status of the project' })
  @Prop({ type: String, enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  @ApiProperty({ description: 'The start date of the project' })
  @Prop()
  startDate: Date;

  @ApiProperty({ description: 'The expected end date of the project' })
  @Prop()
  endDate: Date;

  @ApiProperty({ description: 'Team members assigned to the project' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  teamMembers: Types.ObjectId[];

  @ApiProperty({ description: 'The organization this project belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty({ description: 'The date when the project was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the project was last updated' })
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
