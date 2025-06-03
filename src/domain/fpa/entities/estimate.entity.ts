import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type EstimateDocument = Estimate & Document;

export enum EstimateStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
  ARCHIVED = 'ARCHIVED',
}

// FR01: Count Type Selection
export enum CountType {
  DEVELOPMENT_PROJECT = 'DEVELOPMENT_PROJECT',
  ENHANCEMENT_PROJECT = 'ENHANCEMENT_PROJECT',
  APPLICATION_BASELINE = 'APPLICATION_BASELINE',
}

// FR02: Document Reference Type
export interface DocumentReference {
  id: string;
  name: string;
  type:
    | 'USER_STORY'
    | 'USE_CASE'
    | 'INTERFACE_SPECIFICATION'
    | 'DATA_MODEL'
    | 'OTHER';
  url?: string;
  filePath?: string;
  description?: string;
  uploadedAt: Date;
}

@Schema({ timestamps: true })
export class Estimate {
  @ApiProperty({ description: 'The unique identifier of the estimate' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the estimate' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The description of the estimate' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'The project this estimate belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @ApiProperty({ description: 'The ID of the user who created the estimate' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'The status of the estimate' })
  @Prop({ type: String, enum: EstimateStatus, default: EstimateStatus.DRAFT })
  status: EstimateStatus;

  // FR01: Count Type Selection
  @ApiProperty({
    description: 'The type of function point count being performed',
    enum: CountType,
    example: CountType.DEVELOPMENT_PROJECT,
  })
  @Prop({ type: String, enum: CountType, required: true })
  countType: CountType;

  // FR02: Document References
  @ApiProperty({
    description: 'Supporting documents referenced for this estimate',
    type: [Object],
    example: [
      {
        id: 'doc-1',
        name: 'User Stories.docx',
        type: 'USER_STORY',
        filePath: '/uploads/user-stories.docx',
        description: 'Main user stories document',
        uploadedAt: '2023-01-01T00:00:00.000Z',
      },
    ],
  })
  @Prop({ type: [Object], default: [] })
  documentReferences: DocumentReference[];

  // FR03: Application Boundary and Scope
  @ApiProperty({
    description: 'Definition of the application boundary from user perspective',
    example:
      'The system includes all modules for customer management, order processing, and inventory tracking. External payment gateway and third-party logistics are outside the boundary.',
  })
  @Prop({ required: true })
  applicationBoundary: string;

  @ApiProperty({
    description: 'Definition of the counting scope from user perspective',
    example:
      'Count includes all new functionality for customer self-service portal, updated order management workflows, and new reporting capabilities.',
  })
  @Prop({ required: true })
  countingScope: string;

  @ApiProperty({ description: 'The unadjusted function point count' })
  @Prop({ default: 0 })
  unadjustedFunctionPoints: number;

  @ApiProperty({ description: 'The value adjustment factor' })
  @Prop({ default: 1.0, min: 0.65, max: 1.35 })
  valueAdjustmentFactor: number;

  @ApiProperty({ description: 'The adjusted function point count' })
  @Prop({ default: 0 })
  adjustedFunctionPoints: number;

  @ApiProperty({ description: 'The estimated effort in person-hours' })
  @Prop({ default: 0 })
  estimatedEffortHours: number;

  @ApiProperty({
    description: 'The productivity factor (hours per function point)',
  })
  @Prop({ default: 8 })
  productivityFactor: number;

  // FR09: Estimation Support - Additional fields
  @ApiProperty({
    description: 'Team size for estimation',
    example: 5,
    required: false,
  })
  @Prop()
  teamSize?: number;

  @ApiProperty({
    description: 'Working hours per day per person',
    example: 8,
    required: false,
  })
  @Prop({ default: 8 })
  workingHoursPerDay: number;

  @ApiProperty({
    description: 'Hourly rate for cost calculation',
    example: 75.0,
    required: false,
  })
  @Prop()
  hourlyRate?: number;

  @ApiProperty({ description: 'References to Internal Logical Files (ILFs)' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'ALI' }] })
  internalLogicalFiles: Types.ObjectId[];

  @ApiProperty({ description: 'References to External Interface Files (EIFs)' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'AIE' }] })
  externalInterfaceFiles: Types.ObjectId[];

  @ApiProperty({ description: 'References to External Inputs (EIs)' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'EI' }] })
  externalInputs: Types.ObjectId[];

  @ApiProperty({ description: 'References to External Outputs (EOs)' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'EO' }] })
  externalOutputs: Types.ObjectId[];

  @ApiProperty({ description: 'References to External Queries (EQs)' })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'EQ' }] })
  externalQueries: Types.ObjectId[];

  @ApiProperty({
    description:
      'The General System Characteristics values (0-5 for each of the 14 GSCs)',
  })
  @Prop({ type: [Number], default: Array(14).fill(3) })
  generalSystemCharacteristics: number[];

  @ApiProperty({ description: 'The date when the estimate was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the estimate was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'Optional notes about the estimate' })
  @Prop()
  notes: string;

  @ApiProperty({ description: 'Version number for tracking changes' })
  @Prop({ default: 1 })
  version: number;
}

export const EstimateSchema = SchemaFactory.createForClass(Estimate);
