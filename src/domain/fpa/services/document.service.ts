import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { DocumentReference } from '@domain/fpa/entities/estimate.entity';
import {
  DocumentEntity,
  DocumentType,
} from '@domain/fpa/entities/document.entity';
import {
  IDocumentRepository,
  DOCUMENT_REPOSITORY,
} from '@domain/fpa/interfaces/document.repository.interface';
import { UPLOAD_PATH, MAX_FILE_SIZE } from '@shared/utils/constants';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface DocumentUploadResult {
  document: DocumentEntity;
  documentReference: DocumentReference;
}

@Injectable()
export class DocumentService {
  private readonly uploadPath = UPLOAD_PATH;
  private readonly maxFileSize = parseInt(MAX_FILE_SIZE, 10);
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {
    this.ensureUploadDirectoryExists().catch((error) => {
      console.error('Failed to ensure upload directory exists:', error);
      throw error;
    });
  }

  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async uploadDocument(
    file: UploadedFile,
    documentType: DocumentType,
    estimateId: Types.ObjectId,
    createdBy: Types.ObjectId,
    description?: string,
  ): Promise<DocumentUploadResult> {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, uniqueFilename);

    try {
      await fs.writeFile(filePath, file.buffer);

      const document = await this.documentRepository.create({
        name: file.originalname,
        type: documentType,
        filePath,
        description,
        estimateId,
        createdBy,
        fileSize: file.size,
        mimeType: file.mimetype,
        originalFilename: file.originalname,
      });

      const documentReference: DocumentReference = {
        id: document._id.toString(),
        name: document.name,
        type: document.type,
        filePath: document.filePath,
        description: document.description,
        uploadedAt: document.createdAt,
      };

      return { document, documentReference };
    } catch (error) {
      try {
        await fs.unlink(filePath);
      } catch {
        // Intentionally ignore cleanup errors
      }
      throw new BadRequestException(
        `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createUrlReference(
    url: string,
    name: string,
    documentType: DocumentType,
    estimateId: Types.ObjectId,
    createdBy: Types.ObjectId,
    description?: string,
  ): Promise<DocumentEntity> {
    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    return this.documentRepository.create({
      name,
      type: documentType,
      url,
      description,
      estimateId,
      createdBy,
    });
  }

  async findById(id: Types.ObjectId): Promise<DocumentEntity> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async findByEstimateId(
    estimateId: Types.ObjectId,
  ): Promise<DocumentEntity[]> {
    return this.documentRepository.findByEstimateId(estimateId);
  }

  async getDocumentContent(id: Types.ObjectId): Promise<Buffer> {
    const document = await this.findById(id);

    if (!document.filePath) {
      throw new BadRequestException(
        'Document has no file path - may be a URL reference',
      );
    }

    try {
      return await fs.readFile(document.filePath);
    } catch (error) {
      throw new BadRequestException(
        `Failed to read document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteDocument(id: Types.ObjectId): Promise<void> {
    const document = await this.findById(id);

    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${document.filePath}:`, error);
      }
    }

    const deleted = await this.documentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Document not found or could not be deleted');
    }
  }

  async deleteDocumentsByEstimateId(estimateId: Types.ObjectId): Promise<void> {
    const documents =
      await this.documentRepository.findByEstimateId(estimateId);

    for (const document of documents) {
      if (document.filePath) {
        try {
          await fs.unlink(document.filePath);
        } catch (error) {
          console.warn(`Failed to delete file ${document.filePath}:`, error);
        }
      }
    }

    await this.documentRepository.deleteByEstimateId(estimateId);
  }

  async updateDocument(
    id: Types.ObjectId,
    updateData: { name?: string; description?: string; type?: DocumentType },
  ): Promise<DocumentEntity> {
    const document = await this.documentRepository.update(id, updateData);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  convertToDocumentReference(document: DocumentEntity): DocumentReference {
    return {
      id: document._id.toString(),
      name: document.name,
      type: document.type,
      url: document.url,
      filePath: document.filePath,
      description: document.description,
      uploadedAt: document.createdAt,
    };
  }

  async getDocumentReferencesForEstimate(
    estimateId: Types.ObjectId,
  ): Promise<DocumentReference[]> {
    const documents =
      await this.documentRepository.findByEstimateId(estimateId);
    return documents.map((doc) => this.convertToDocumentReference(doc));
  }
}
