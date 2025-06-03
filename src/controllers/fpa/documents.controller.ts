import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import {
  DocumentService,
  UploadedFile as DocumentFile,
} from '@domain/fpa/services/document.service';
import { DocumentReference } from '@domain/fpa/entities/estimate.entity';
import {
  DocumentEntity,
  DocumentType,
} from '@domain/fpa/entities/document.entity';
import {
  CreateUrlReferenceDto,
  UploadDocumentDto,
  UpdateDocumentDto,
  DocumentResponseDto,
} from '@application/fpa/dtos/document.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('estimate-documents')
@Controller('estimates/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a supporting document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: DocumentFile,
    @Body() uploadDto: UploadDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    document: DocumentEntity;
    documentReference: DocumentReference;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!uploadDto.type || !uploadDto.estimateId) {
      throw new BadRequestException(
        'Document type and estimate ID are required',
      );
    }

    const estimateId = new Types.ObjectId(uploadDto.estimateId);
    const createdBy = new Types.ObjectId(req.user.id);

    try {
      const result = await this.documentService.uploadDocument(
        file,
        uploadDto.type,
        estimateId,
        createdBy,
        uploadDto.description,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('url-reference')
  @ApiOperation({ summary: 'Create a URL reference to a document' })
  @ApiResponse({
    status: 201,
    description: 'URL reference created successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or missing required fields',
  })
  async createUrlReference(
    @Body() createUrlReferenceDto: CreateUrlReferenceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ document: DocumentEntity }> {
    const estimateId = new Types.ObjectId(createUrlReferenceDto.estimateId);
    const createdBy = new Types.ObjectId(req.user.id);

    try {
      const document = await this.documentService.createUrlReference(
        createUrlReferenceDto.url,
        createUrlReferenceDto.name,
        createUrlReferenceDto.type,
        estimateId,
        createdBy,
        createUrlReferenceDto.description,
      );

      return { document };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create URL reference: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get('estimate/:estimateId')
  @ApiOperation({ summary: 'Get all documents for an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [DocumentResponseDto],
  })
  async getDocumentsByEstimate(
    @Param('estimateId') estimateId: string,
  ): Promise<{ documents: DocumentEntity[] }> {
    const objectId = new Types.ObjectId(estimateId);
    const documents = await this.documentService.findByEstimateId(objectId);
    return { documents };
  }

  @Get(':documentId/download')
  @ApiOperation({ summary: 'Download a document by its ID' })
  @ApiParam({ name: 'documentId', description: 'The document ID' })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const objectId = new Types.ObjectId(documentId);
      const document = await this.documentService.findById(objectId);

      if (!document.filePath) {
        throw new BadRequestException(
          'Document is a URL reference and cannot be downloaded',
        );
      }

      const fileContent =
        await this.documentService.getDocumentContent(objectId);

      res.setHeader(
        'Content-Type',
        document.mimeType || 'application/octet-stream',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.originalFilename || document.name}"`,
      );
      res.setHeader('Content-Length', fileContent.length);

      res.send(fileContent);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':documentId')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'documentId', description: 'The document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @Param('documentId') documentId: string,
  ): Promise<{ success: boolean }> {
    try {
      const objectId = new Types.ObjectId(documentId);
      await this.documentService.deleteDocument(objectId);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':documentId')
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiParam({ name: 'documentId', description: 'The document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document details retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentById(
    @Param('documentId') documentId: string,
  ): Promise<{ document: DocumentEntity }> {
    const objectId = new Types.ObjectId(documentId);
    const document = await this.documentService.findById(objectId);
    return { document };
  }

  @Post(':documentId/update')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiParam({ name: 'documentId', description: 'The document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateDocument(
    @Param('documentId') documentId: string,
    @Body() updateData: UpdateDocumentDto,
  ): Promise<{ document: DocumentEntity }> {
    const objectId = new Types.ObjectId(documentId);
    const document = await this.documentService.updateDocument(
      objectId,
      updateData,
    );
    return { document };
  }
}
