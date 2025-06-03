import { Injectable, Inject } from '@nestjs/common';
import { Types } from 'mongoose';
import { DocumentService } from './document.service';
import {
  DocumentEntity,
  DocumentType,
} from '@domain/fpa/entities/document.entity';
import { DocumentReference } from '@domain/fpa/entities/estimate.entity';
import {
  IEstimateRepository,
  ESTIMATE_REPOSITORY,
} from '@domain/fpa/interfaces/estimate.repository.interface';

@Injectable()
export class EstimateDocumentService {
  constructor(
    private readonly documentService: DocumentService,
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  async addDocumentToEstimate(
    estimateId: Types.ObjectId,
    document: DocumentEntity,
  ): Promise<void> {
    const estimate = await this.estimateRepository.findById(
      estimateId.toString(),
    );
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const documentReference =
      this.documentService.convertToDocumentReference(document);

    estimate.documentReferences.push(documentReference);
    await this.estimateRepository.update(estimateId.toString(), {
      documentReferences: estimate.documentReferences,
    });
  }

  async removeDocumentFromEstimate(
    estimateId: Types.ObjectId,
    documentId: Types.ObjectId,
  ): Promise<void> {
    const estimate = await this.estimateRepository.findById(
      estimateId.toString(),
    );
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    estimate.documentReferences = estimate.documentReferences.filter(
      (doc) => doc.id !== documentId.toString(),
    );

    await this.estimateRepository.update(estimateId.toString(), {
      documentReferences: estimate.documentReferences,
    });

    // Delete the actual document
    await this.documentService.deleteDocument(documentId);
  }

  async getEstimateDocuments(
    estimateId: Types.ObjectId,
  ): Promise<DocumentEntity[]> {
    return this.documentService.findByEstimateId(estimateId);
  }

  async getEstimateDocumentReferences(
    estimateId: Types.ObjectId,
  ): Promise<DocumentReference[]> {
    return this.documentService.getDocumentReferencesForEstimate(estimateId);
  }

  async syncEstimateDocumentReferences(
    estimateId: Types.ObjectId,
  ): Promise<void> {
    const documents = await this.documentService.findByEstimateId(estimateId);
    const documentReferences = documents.map((doc) =>
      this.documentService.convertToDocumentReference(doc),
    );

    await this.estimateRepository.update(estimateId.toString(), {
      documentReferences,
    });
  }

  async deleteEstimateDocuments(estimateId: Types.ObjectId): Promise<void> {
    await this.documentService.deleteDocumentsByEstimateId(estimateId);

    // Also clear document references from estimate
    await this.estimateRepository.update(estimateId.toString(), {
      documentReferences: [],
    });
  }

  async migrateEstimateDocuments(
    estimateId: Types.ObjectId,
    createdBy: Types.ObjectId,
  ): Promise<void> {
    const estimate = await this.estimateRepository.findById(
      estimateId.toString(),
    );
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Check if migration is needed (if there are document references but no actual documents)
    const existingDocuments =
      await this.documentService.findByEstimateId(estimateId);
    if (existingDocuments.length > 0) {
      return; // Already migrated
    }

    // Migrate existing document references to new document entities
    for (const docRef of estimate.documentReferences) {
      if (docRef.url) {
        // Create URL reference document
        await this.documentService.createUrlReference(
          docRef.url,
          docRef.name,
          docRef.type as DocumentType,
          estimateId,
          createdBy,
          docRef.description,
        );
      } else if (docRef.filePath) {
        // For file references, we would need additional logic to handle existing files
        // This is a simplified approach - in practice, you'd need to check if files exist
        console.warn(
          `File document migration not implemented for ${docRef.name}`,
        );
      }
    }

    // Re-sync document references
    await this.syncEstimateDocumentReferences(estimateId);
  }
}
