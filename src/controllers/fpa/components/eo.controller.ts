import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Put,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { EO } from '@domain/fpa/entities/eo.entity';
import {
  EO_REPOSITORY,
  IEORepository,
} from '@domain/fpa/interfaces/eo.repository.interface';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { CreateEODto } from '@application/fpa/dtos/components/create-eo.dto';
import { UpdateEODto } from '@application/fpa/dtos/components/update-eo.dto';

@ApiTags('estimate-components')
@Controller('estimates/:estimateId/eo')
@UseGuards(JwtAuthGuard)
export class EOController {
  constructor(
    @Inject(EO_REPOSITORY)
    private readonly eoRepository: IEORepository,
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add an External Output (EO) to an estimate',
  })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'EO added successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiBody({ type: CreateEODto })
  async create(
    @Param('estimateId') estimateId: string,
    @Body() eoData: Partial<EO>,
  ): Promise<EO> {
    try {
      // Verify estimate exists
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      // Link to estimate's project
      eoData.projectId = estimate.projectId;

      // Create the EO component
      const createdEO = await this.eoRepository.create(eoData);

      // Add reference to the estimate
      if (!estimate.externalOutputs) {
        estimate.externalOutputs = [];
      }
      estimate.externalOutputs.push(createdEO._id);
      await this.estimateRepository.update(estimateId, {
        externalOutputs: estimate.externalOutputs,
      });

      return createdEO;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add EO to estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all EOs for an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all EOs for the estimate',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findAll(@Param('estimateId') estimateId: string): Promise<EO[]> {
    try {
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (!estimate.externalOutputs || estimate.externalOutputs.length === 0) {
        return [];
      }

      // Convert ObjectIds to strings
      const eoIds = estimate.externalOutputs.map((id) => id.toString());
      return this.eoRepository.findByIds(eoIds);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EOs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an EO by ID' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EO ID' })
  @ApiResponse({ status: 200, description: 'Returns the EO' })
  @ApiResponse({ status: 404, description: 'EO or estimate not found' })
  async findOne(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
  ): Promise<EO> {
    try {
      // Verify estimate exists and contains this EO
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalOutputs ||
        !estimate.externalOutputs.some((eoId) => eoId.toString() === id)
      ) {
        throw new NotFoundException(
          `EO with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const eo = await this.eoRepository.findById(id);
      if (!eo) {
        throw new NotFoundException(`EO with ID ${id} not found`);
      }

      return eo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EO: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an EO' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EO ID' })
  @ApiResponse({ status: 200, description: 'EO updated successfully' })
  @ApiResponse({ status: 404, description: 'EO or estimate not found' })
  @ApiBody({ type: UpdateEODto })
  async update(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
    @Body() eoData: Partial<EO>,
  ): Promise<EO> {
    try {
      // Verify estimate exists and contains this EO
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalOutputs ||
        !estimate.externalOutputs.some((eoId) => eoId.toString() === id)
      ) {
        throw new NotFoundException(
          `EO with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const updatedEO = await this.eoRepository.update(id, eoData);
      if (!updatedEO) {
        throw new NotFoundException(`EO with ID ${id} not found`);
      }

      return updatedEO;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update EO: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an EO from an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EO ID' })
  @ApiResponse({ status: 200, description: 'EO removed successfully' })
  @ApiResponse({ status: 404, description: 'EO or estimate not found' })
  async remove(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    try {
      // Verify estimate exists
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      // Remove reference from estimate
      if (estimate.externalOutputs) {
        estimate.externalOutputs = estimate.externalOutputs.filter(
          (eoId) => eoId.toString() !== id,
        );
        await this.estimateRepository.update(estimateId, {
          externalOutputs: estimate.externalOutputs,
        });
      }

      // Delete the EO
      const result = await this.eoRepository.delete(id);
      return { success: result };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove EO: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
