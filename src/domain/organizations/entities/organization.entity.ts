import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @ApiProperty({ description: 'The unique identifier of the organization' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the organization' })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({ description: 'The description of the organization' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'The website URL of the organization' })
  @Prop()
  website?: string;

  @ApiProperty({ description: 'The industry of the organization' })
  @Prop()
  industry?: string;

  @ApiProperty({
    description: 'The ID of the user who created the organization',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'The date when the organization was created' })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the organization was last updated',
  })
  updatedAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
