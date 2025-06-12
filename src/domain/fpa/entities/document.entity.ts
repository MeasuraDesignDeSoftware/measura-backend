import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type DocumentEntityDocument = DocumentEntity & MongoDocument;

export enum DocumentType {
  USER_STORY = 'USER_STORY',
  USE_CASE = 'USE_CASE',
  INTERFACE_SPECIFICATION = 'INTERFACE_SPECIFICATION',
  DATA_MODEL = 'DATA_MODEL',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class DocumentEntity {
  @ApiProperty({ description: 'The unique identifier of the document' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'The name of the document' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'The type of document' })
  @Prop({ type: String, enum: DocumentType, required: true })
  type: DocumentType;

  @ApiProperty({ description: 'URL reference to external document' })
  @Prop()
  url?: string;

  @ApiProperty({ description: 'Local file path for uploaded documents' })
  @Prop()
  filePath?: string;

  @ApiProperty({ description: 'Description of the document' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'The estimate this document belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Estimate', required: true })
  estimateId: Types.ObjectId;

  @ApiProperty({
    description: 'The user who uploaded/created the document reference',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'File size in bytes for uploaded files' })
  @Prop()
  fileSize?: number;

  @ApiProperty({ description: 'MIME type for uploaded files' })
  @Prop()
  mimeType?: string;

  @ApiProperty({ description: 'Original filename for uploaded files' })
  @Prop()
  originalFilename?: string;

  @ApiProperty({ description: 'The date when the document was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the document was last updated' })
  updatedAt: Date;
}

export const DocumentEntitySchema =
  SchemaFactory.createForClass(DocumentEntity);

// Create indexes for better performance
DocumentEntitySchema.index({ estimateId: 1 });
DocumentEntitySchema.index({ createdBy: 1 });
DocumentEntitySchema.index({ type: 1 });
