import { Types } from 'mongoose';
import {
  DocumentEntity,
  DocumentType,
} from '@domain/fpa/entities/document.entity';

export const DOCUMENT_REPOSITORY = 'DOCUMENT_REPOSITORY';

export interface IDocumentRepository {
  create(document: Partial<DocumentEntity>): Promise<DocumentEntity>;
  findById(id: Types.ObjectId): Promise<DocumentEntity | null>;
  findByEstimateId(estimateId: Types.ObjectId): Promise<DocumentEntity[]>;
  findByType(type: DocumentType): Promise<DocumentEntity[]>;
  findByEstimateIdAndType(
    estimateId: Types.ObjectId,
    type: DocumentType,
  ): Promise<DocumentEntity[]>;
  update(
    id: Types.ObjectId,
    updateData: Partial<DocumentEntity>,
  ): Promise<DocumentEntity | null>;
  delete(id: Types.ObjectId): Promise<boolean>;
  deleteByEstimateId(estimateId: Types.ObjectId): Promise<boolean>;
  findAll(): Promise<DocumentEntity[]>;
  countByEstimateId(estimateId: Types.ObjectId): Promise<number>;
}
