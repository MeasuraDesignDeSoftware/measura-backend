import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ObjectiveStatus } from '@domain/objectives/entities/objective.entity';

@Schema({ timestamps: true })
export class ObjectiveDocument extends Document {
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
    type: String,
    enum: Object.values(ObjectiveStatus),
    default: ObjectiveStatus.DRAFT,
  })
  status: ObjectiveStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
  organizationId?: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ObjectiveSchema = SchemaFactory.createForClass(ObjectiveDocument);
