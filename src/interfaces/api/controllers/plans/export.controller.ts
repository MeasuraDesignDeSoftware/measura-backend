import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  StreamableFile,
  Header,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@interfaces/api/guards/jwt-auth.guard';
import { GetUser } from '@interfaces/api/decorators/get-user.decorator';
import { PlanExportService } from '@application/plans/use-cases/plan-export.service';
import { PlanDto, ImportPlanDto } from '@domain/plans/dtos';
import { ParseMongoIdPipe } from '@app/shared/utils/pipes/parse-mongo-id.pipe';

interface RequestUser {
  id: string;
  [key: string]: any;
}

@ApiTags('Plan Export/Import')
@Controller('plans/export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanExportController {
  private readonly logger = new Logger(PlanExportController.name);

  constructor(private readonly planExportService: PlanExportService) {}

  private handleExportError(error: unknown, operation: string): never {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`Error ${operation}: ${errorMessage}`, errorStack);

    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }
    throw new InternalServerErrorException(`Failed to ${operation}`);
  }

  @Get(':id/json')
  @ApiOperation({ summary: 'Export a plan as JSON' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan exported successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="plan.json"')
  async exportAsJson(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<StreamableFile> {
    try {
      const jsonData = await this.planExportService.exportAsJson(id);
      return new StreamableFile(Buffer.from(jsonData));
    } catch (error) {
      return this.handleExportError(error, 'exporting plan as JSON');
    }
  }

  @Get(':id/csv')
  @ApiOperation({ summary: 'Export a plan as CSV' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan exported successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="plan.csv"')
  async exportAsCsv(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<StreamableFile> {
    try {
      const csvData = await this.planExportService.exportAsCsv(id);
      return new StreamableFile(Buffer.from(csvData));
    } catch (error) {
      return this.handleExportError(error, 'exporting plan as CSV');
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Export a plan as PDF' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan exported successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="plan.pdf"')
  async exportAsPdf(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<StreamableFile> {
    try {
      const pdfBuffer = await this.planExportService.exportAsPdf(id);
      return new StreamableFile(pdfBuffer);
    } catch (error) {
      return this.handleExportError(error, 'exporting plan as PDF');
    }
  }

  @Post('import/json')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import a plan from JSON' })
  @ApiBody({ description: 'JSON content to import', type: ImportPlanDto })
  @ApiResponse({
    status: 201,
    description: 'Plan imported successfully',
    type: PlanDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid JSON data' })
  async importFromJson(
    @Body() importData: ImportPlanDto,
    @GetUser() user: RequestUser,
  ): Promise<PlanDto> {
    try {
      if (!importData || !importData.content) {
        throw new BadRequestException('JSON content is required');
      }

      return await this.planExportService.importFromJson(
        importData.content,
        user.id,
      );
    } catch (error) {
      return this.handleExportError(error, 'importing plan from JSON');
    }
  }
}
