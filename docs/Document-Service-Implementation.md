# Document Service Database Integration Implementation

## Overview

The document service has been fully integrated with MongoDB for persistent storage and complete CRUD operations. This implementation replaces the previous file-only approach with a robust database-backed solution.

## Architecture

### Components Implemented

1. **Document Entity** (`src/domain/fpa/entities/document.entity.ts`)

   - MongoDB schema for document metadata
   - Supports both file uploads and URL references
   - Linked to estimates via `estimateId`

2. **Document Repository** (`src/infrastructure/repositories/fpa/document.repository.ts`)

   - Full CRUD operations
   - Query methods for finding documents by estimate, type, etc.
   - Implements `IDocumentRepository` interface

3. **Enhanced Document Service** (`src/domain/fpa/services/document.service.ts`)

   - Database-integrated file upload and storage
   - URL reference creation and management
   - File system operations with metadata persistence

4. **Estimate Document Service** (`src/domain/fpa/services/estimate-document.service.ts`)

   - High-level operations for document-estimate relationships
   - Migration utilities for existing data
   - Synchronization between database and estimate document references

5. **Document DTOs** (`src/application/fpa/dtos/document.dto.ts`)

   - Validation for document operations
   - API documentation with Swagger decorators

6. **Enhanced Documents Controller** (`src/controllers/fpa/documents.controller.ts`)
   - Complete REST API implementation
   - File upload, download, and management endpoints
   - Proper error handling and authentication

## Database Schema

### DocumentEntity Structure

```typescript
{
  _id: ObjectId,
  name: string,
  type: DocumentType, // USER_STORY | USE_CASE | INTERFACE_SPECIFICATION | DATA_MODEL | OTHER
  url?: string, // For URL references
  filePath?: string, // For uploaded files
  description?: string,
  estimateId: ObjectId, // Reference to estimate
  createdBy: ObjectId, // User who created the document
  fileSize?: number, // File size in bytes
  mimeType?: string, // MIME type for uploaded files
  originalFilename?: string, // Original filename
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `estimateId` - For efficient document retrieval by estimate
- `createdBy` - For user-specific queries
- `type` - For filtering by document type

## API Endpoints

### Document Management

- `POST /estimates/documents/upload` - Upload a file document
- `POST /estimates/documents/url-reference` - Create a URL reference
- `GET /estimates/documents/estimate/:estimateId` - Get all documents for an estimate
- `GET /estimates/documents/:documentId` - Get document details
- `GET /estimates/documents/:documentId/download` - Download a file document
- `POST /estimates/documents/:documentId/update` - Update document metadata
- `DELETE /estimates/documents/:documentId` - Delete a document

### Request/Response Examples

#### Upload Document

```typescript
// POST /estimates/documents/upload
// multipart/form-data with file + JSON body
{
  "type": "USER_STORY",
  "estimateId": "507f1f77bcf86cd799439011",
  "description": "Main user stories document"
}
```

#### Create URL Reference

```typescript
// POST /estimates/documents/url-reference
{
  "name": "Requirements Document",
  "url": "https://company.sharepoint.com/requirements.docx",
  "type": "INTERFACE_SPECIFICATION",
  "estimateId": "507f1f77bcf86cd799439011",
  "description": "External requirements document"
}
```

## Key Features

### 1. **Dual Storage Support**

- **File Uploads**: Physical files stored on disk with metadata in database
- **URL References**: External document links stored as metadata only

### 2. **Comprehensive Validation**

- File type restrictions (PDF, Word, Excel, images, text)
- File size limits (configurable via environment variables)
- URL format validation
- Required field validation

### 3. **Security & Authentication**

- JWT-based authentication required for all endpoints
- User tracking for all document operations
- File access control through document ownership

### 4. **Integration with Estimates**

- Documents are linked to specific estimates
- Document references maintained in estimate entities
- Cascade operations for estimate deletion

### 5. **Migration Support**

- Utilities to migrate existing document references
- Backward compatibility with legacy document structure
- Data synchronization helpers

## Configuration

### Environment Variables

```env
UPLOAD_PATH=./uploads/documents
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Allowed File Types

- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `text/plain`
- `image/jpeg`
- `image/png`
- `image/gif`

## Usage Examples

### Service Usage

```typescript
// Inject services
constructor(
  private readonly documentService: DocumentService,
  private readonly estimateDocumentService: EstimateDocumentService,
) {}

// Upload a document
const result = await this.documentService.uploadDocument(
  file,
  DocumentType.USER_STORY,
  estimateId,
  userId,
  "Optional description"
);

// Create URL reference
const document = await this.documentService.createUrlReference(
  "https://example.com/doc.pdf",
  "External Document",
  DocumentType.INTERFACE_SPECIFICATION,
  estimateId,
  userId,
  "Description"
);

// Get documents for an estimate
const documents = await this.documentService.findByEstimateId(estimateId);

// Migrate existing estimate documents
await this.estimateDocumentService.migrateEstimateDocuments(estimateId, userId);
```

### Repository Usage

```typescript
// Direct repository access
const document = await this.documentRepository.create({
  name: 'Test Document',
  type: DocumentType.OTHER,
  estimateId: new Types.ObjectId(),
  createdBy: new Types.ObjectId(),
});

const documents = await this.documentRepository.findByEstimateId(estimateId);
const count = await this.documentRepository.countByEstimateId(estimateId);
```

## Error Handling

### Common Error Scenarios

- File size exceeds limit → `BadRequestException`
- Invalid file type → `BadRequestException`
- Document not found → `NotFoundException`
- Invalid URL format → `BadRequestException`
- Missing authentication → `UnauthorizedException`

### File System Errors

- Upload failures are handled with automatic cleanup
- Download errors provide appropriate HTTP status codes
- File deletion errors are logged but don't block operations

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields (`estimateId`, `createdBy`, `type`)
- Efficient bulk operations for estimate-level document management
- Optimized queries to avoid N+1 problems

### File System Optimization

- Unique filename generation to prevent conflicts
- Automatic directory creation for upload paths
- Cleanup operations for failed uploads

## Migration Strategy

### For Existing Estimates

1. **Assess Current State**: Check if documents already exist in database
2. **Migrate URL References**: Convert existing URL references to document entities
3. **Handle File References**: Log file references that need manual migration
4. **Sync References**: Update estimate document references to match database

### Migration Script Example

```typescript
// Migrate all estimates
const estimates = await estimateRepository.findAll();
for (const estimate of estimates) {
  await estimateDocumentService.migrateEstimateDocuments(
    estimate._id,
    estimate.createdBy,
  );
}
```

## Testing

### Unit Tests Required

- Document service methods
- Repository operations
- File upload/download functionality
- URL validation
- Error scenarios

### Integration Tests Required

- Full document lifecycle (create, read, update, delete)
- File upload and download workflows
- Authentication and authorization
- Migration processes

## Future Enhancements

### Planned Features

- Document versioning
- Document templates
- Bulk document operations
- Document sharing between estimates
- Advanced search and filtering
- Document preview generation
- Integration with external document systems

### Performance Improvements

- File caching mechanisms
- CDN integration for file delivery
- Asynchronous file processing
- Database query optimization

## Conclusion

The document service implementation provides a robust, scalable solution for managing documents within the FPA system. It maintains backward compatibility while adding comprehensive database integration, proper validation, and a complete REST API for document operations.

The implementation follows clean architecture principles with clear separation of concerns, making it maintainable and extensible for future requirements.
