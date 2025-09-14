import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from '@shared/utils/pipes/parse-mongo-id.pipe';
import { MeasurementPlanService } from '@application/measurement-plans/use-cases/measurement-plan.service';
import {
  ExportMeasurementPlanDto,
  ExportResponseDto,
} from '@application/measurement-plans/dtos';

interface AuthenticatedRequest {
  user: {
    _id: string;
    email: string;
    organizationId: string | null;
  };
}

@ApiTags('Measurement Plans Export')
@Controller('measurement-plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeasurementPlansExportController {
  constructor(
    private readonly measurementPlanService: MeasurementPlanService,
  ) {}

  @Post(':organizationId/:planId/export')
  @ApiOperation({ summary: 'Export measurement plan as PDF or DOCX' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'planId', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Export generated successfully',
    type: ExportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid export options' })
  async exportPlan(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Param('planId', ParseMongoIdPipe) planId: string,
    @Body() exportDto: ExportMeasurementPlanDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Validate user belongs to this organization
    if (!req.user.organizationId) {
      throw new ForbiddenException(
        'You must be assigned to an organization to export measurement plans. Please contact your administrator to be added to an organization.',
      );
    }
    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    // First verify the plan exists and user has access
    await this.measurementPlanService.findOne(
      planId,
      organizationId,
    );

    // For now, return a mock response since implementing PDF/DOCX generation
    // requires additional dependencies like puppeteer or docx
    const filename = `measurement-plan-${planId}.${exportDto.format}`;
    const downloadUrl = `/api/exports/${filename}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // TODO: Implement actual PDF/DOCX generation
    // This would typically involve:
    // 1. Creating a template engine (Handlebars, Mustache, etc.)
    // 2. Generating PDF with puppeteer or similar
    // 3. Generating DOCX with docx library
    // 4. Storing temporary files
    // 5. Setting up cleanup job for expired files

    const mockResponse: ExportResponseDto = {
      downloadUrl,
      filename,
      expiresAt: expiresAt.toISOString(),
    };

    return mockResponse;
  }

  // Placeholder for actual file download endpoint
  // This would be implemented once export generation is complete
  /*
  @Get('exports/:filename')
  @ApiOperation({ summary: 'Download exported file' })
  @ApiParam({ name: 'filename', description: 'Export filename' })
  @Header('Content-Type', 'application/octet-stream')
  async downloadExport(@Param('filename') filename: string): Promise<StreamableFile> {
    // Implementation would:
    // 1. Validate file exists and hasn't expired
    // 2. Set appropriate content type based on file extension
    // 3. Return file stream
    // 4. Schedule file deletion after download

    throw new NotFoundException('Export file not found or expired');
  }
  */
}
