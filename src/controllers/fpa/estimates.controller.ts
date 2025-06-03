import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { GetUser } from '@shared/utils/decorators/get-user.decorator';
import { User } from '@domain/users/entities/user.entity';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { Inject } from '@nestjs/common';
import { Estimate, EstimateStatus } from '@domain/fpa/entities/estimate.entity';
import { Types } from 'mongoose';
import { CreateEstimateDto } from '@application/fpa/dtos/create-estimate.dto';
import { UpdateEstimateDto } from '@application/fpa/dtos/update-estimate.dto';

@ApiTags('estimates')
@Controller('estimates')
@UseGuards(JwtAuthGuard)
export class EstimatesController {
  constructor(
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new estimate' })
  @ApiResponse({ status: 201, description: 'Estimate created successfully' })
  @ApiBody({
    type: CreateEstimateDto,
    description: 'Estimate data to create a new estimate',
  })
  async create(
    @Body() estimateData: Partial<Estimate>,
    @GetUser() user: User,
  ): Promise<Estimate> {
    try {
      // Set the creator to the current user
      estimateData.createdBy = new Types.ObjectId(user._id);

      // Set default status if not provided
      if (!estimateData.status) {
        estimateData.status = EstimateStatus.DRAFT;
      }

      // Set initial version
      estimateData.version = 1;

      return await this.estimateRepository.create(estimateData);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all estimates' })
  @ApiResponse({ status: 200, description: 'Returns all estimates' })
  async findAll(@Query('projectId') projectId?: string): Promise<Estimate[]> {
    try {
      if (projectId) {
        return await this.estimateRepository.findByProject(projectId);
      }
      return await this.estimateRepository.findAll();
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch estimates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get estimate by id' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 200, description: 'Returns the estimate' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findOne(@Param('id') id: string): Promise<Estimate> {
    try {
      const estimate = await this.estimateRepository.findById(id);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }
      return estimate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 200, description: 'Estimate updated successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiBody({
    type: UpdateEstimateDto,
    description: 'Updated estimate data',
  })
  async update(
    @Param('id') id: string,
    @Body() estimateData: Partial<Estimate>,
  ): Promise<Estimate> {
    try {
      const updatedEstimate = await this.estimateRepository.update(
        id,
        estimateData,
      );
      if (!updatedEstimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }
      return updatedEstimate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 200, description: 'Estimate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      const result = await this.estimateRepository.delete(id);
      if (!result) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post(':id/version')
  @ApiOperation({ summary: 'Create a new version of an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'New version created successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async createNewVersion(@Param('id') id: string): Promise<Estimate> {
    try {
      const newVersion = await this.estimateRepository.createNewVersion(id);
      if (!newVersion) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }
      return newVersion;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create new version: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
