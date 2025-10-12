import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type OrganizationInvitationDocument = OrganizationInvitation & Document;

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class OrganizationInvitation {
  @ApiProperty({ description: 'The unique identifier of the invitation' })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'The email or username of the user being invited',
  })
  @Prop({ required: true })
  userIdentifier: string;

  @ApiProperty({ description: 'The organization the user is invited to' })
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty({ description: 'The user who sent the invitation' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @ApiProperty({
    description: 'The status of the invitation',
    enum: InvitationStatus,
  })
  @Prop({
    type: String,
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'The date when the invitation was responded to',
    required: false,
  })
  @Prop()
  respondedAt?: Date;

  @ApiProperty({ description: 'The date when the invitation was created' })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the invitation was last updated',
  })
  updatedAt: Date;
}

export const OrganizationInvitationSchema = SchemaFactory.createForClass(
  OrganizationInvitation,
);

// Add indexes for performance
OrganizationInvitationSchema.index({ userIdentifier: 1 });
OrganizationInvitationSchema.index({ organizationId: 1 });
OrganizationInvitationSchema.index({ status: 1 });
OrganizationInvitationSchema.index({ userIdentifier: 1, status: 1 });
OrganizationInvitationSchema.index({ organizationId: 1, status: 1 });
