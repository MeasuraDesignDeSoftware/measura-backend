import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsMongoId,
} from 'class-validator';
import { DocumentType } from '@domain/fpa/entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ description: 'The name of the document' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The type of document', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'The estimate this document belongs to' })
  @IsMongoId()
  estimateId: string;

  @ApiProperty({ description: 'Description of the document', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateUrlReferenceDto extends CreateDocumentDto {
  @ApiProperty({ description: 'URL reference to external document' })
  @IsUrl()
  url: string;
}

export class UploadDocumentDto extends CreateDocumentDto {
  // File will be handled by multer middleware
}

export class UpdateDocumentDto {
  @ApiProperty({ description: 'The name of the document', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The type of document',
    enum: DocumentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiProperty({ description: 'Description of the document', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DocumentResponseDto {
  @ApiProperty({ description: 'The unique identifier of the document' })
  id: string;

  @ApiProperty({ description: 'The name of the document' })
  name: string;

  @ApiProperty({ description: 'The type of document', enum: DocumentType })
  type: DocumentType;

  @ApiProperty({
    description: 'URL reference to external document',
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: 'Local file path for uploaded documents',
    required: false,
  })
  filePath?: string;

  @ApiProperty({ description: 'Description of the document', required: false })
  description?: string;

  @ApiProperty({ description: 'The estimate this document belongs to' })
  estimateId: string;

  @ApiProperty({
    description: 'The user who uploaded/created the document reference',
  })
  createdBy: string;

  @ApiProperty({
    description: 'File size in bytes for uploaded files',
    required: false,
  })
  fileSize?: number;

  @ApiProperty({ description: 'MIME type for uploaded files', required: false })
  mimeType?: string;

  @ApiProperty({
    description: 'Original filename for uploaded files',
    required: false,
  })
  originalFilename?: string;

  @ApiProperty({ description: 'The date when the document was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the document was last updated' })
  updatedAt: Date;
}
