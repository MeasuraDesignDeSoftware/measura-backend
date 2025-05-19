import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PlanStatus } from '@domain/plans/entities/plan.entity';

@Schema({ timestamps: true })
export class PlanDocument extends Document {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({
    required: true,
    type: [MongooseSchema.Types.ObjectId],
    ref: 'Goal',
  })
  goalIds: MongooseSchema.Types.ObjectId[];

  @Prop({
    required: true,
    type: [MongooseSchema.Types.ObjectId],
    ref: 'Objective',
  })
  objectiveIds: MongooseSchema.Types.ObjectId[];

  @Prop({
    required: true,
    type: String,
    enum: Object.values(PlanStatus),
    default: PlanStatus.DRAFT,
  })
  status: PlanStatus;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  approvedDate?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
  organizationId?: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Number, default: 1 })
  version: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PlanSchema = SchemaFactory.createForClass(PlanDocument);
