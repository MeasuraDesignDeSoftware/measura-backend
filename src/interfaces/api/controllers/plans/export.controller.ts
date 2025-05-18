import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
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
import { PlanDto } from '@domain/plans/dtos/plan.dto';

class ImportPlanDto {
  content: string;
}

@ApiTags('Plan Export/Import')
@Controller('plans/export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanExportController {
  constructor(private readonly planExportService: PlanExportService) {}

  @Get(':id/json')
  @ApiOperation({ summary: 'Export a plan as JSON' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan exported successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async exportAsJson(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const jsonData = await this.planExportService.exportAsJson(id);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="plan-${id}.json"`,
      );
      res.send(jsonData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to export plan as JSON');
    }
  }

  @Get(':id/csv')
  @ApiOperation({ summary: 'Export a plan as CSV' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan exported successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async exportAsCsv(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const csvData = await this.planExportService.exportAsCsv(id);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="plan-${id}.csv"`,
      );
      res.send(csvData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to export plan as CSV');
    }
  }

  @Post('import/json')
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
    @GetUser() user: any,
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
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to import plan from JSON');
    }
  }
}
