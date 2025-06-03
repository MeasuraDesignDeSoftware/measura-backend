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
import { EQ } from '@domain/fpa/entities/eq.entity';
import {
  EQ_REPOSITORY,
  IEQRepository,
} from '@domain/fpa/interfaces/eq.repository.interface';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { CreateEQDto } from '@application/fpa/dtos/components/create-eq.dto';
import { UpdateEQDto } from '@application/fpa/dtos/components/update-eq.dto';

@ApiTags('estimate-components')
@Controller('estimates/:estimateId/eq')
@UseGuards(JwtAuthGuard)
export class EQController {
  constructor(
    @Inject(EQ_REPOSITORY)
    private readonly eqRepository: IEQRepository,
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add an External Query (EQ) to an estimate',
  })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'EQ added successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiBody({ type: CreateEQDto })
  async create(
    @Param('estimateId') estimateId: string,
    @Body() eqData: Partial<EQ>,
  ): Promise<EQ> {
    try {
      // Verify estimate exists
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      // Link to estimate's project
      eqData.projectId = estimate.projectId;

      // Create the EQ component
      const createdEQ = await this.eqRepository.create(eqData);

      // Add reference to the estimate
      if (!estimate.externalQueries) {
        estimate.externalQueries = [];
      }
      estimate.externalQueries.push(createdEQ._id);
      await this.estimateRepository.update(estimateId, {
        externalQueries: estimate.externalQueries,
      });

      return createdEQ;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add EQ to estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all EQs for an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all EQs for the estimate',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findAll(@Param('estimateId') estimateId: string): Promise<EQ[]> {
    try {
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (!estimate.externalQueries || estimate.externalQueries.length === 0) {
        return [];
      }

      // Convert ObjectIds to strings
      const eqIds = estimate.externalQueries.map((id) => id.toString());
      return this.eqRepository.findByIds(eqIds);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EQs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an EQ by ID' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EQ ID' })
  @ApiResponse({ status: 200, description: 'Returns the EQ' })
  @ApiResponse({ status: 404, description: 'EQ or estimate not found' })
  async findOne(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
  ): Promise<EQ> {
    try {
      // Verify estimate exists and contains this EQ
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalQueries ||
        !estimate.externalQueries.some((eqId) => eqId.toString() === id)
      ) {
        throw new NotFoundException(
          `EQ with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const eq = await this.eqRepository.findById(id);
      if (!eq) {
        throw new NotFoundException(`EQ with ID ${id} not found`);
      }

      return eq;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EQ: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an EQ' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EQ ID' })
  @ApiResponse({ status: 200, description: 'EQ updated successfully' })
  @ApiResponse({ status: 404, description: 'EQ or estimate not found' })
  @ApiBody({ type: UpdateEQDto })
  async update(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
    @Body() eqData: Partial<EQ>,
  ): Promise<EQ> {
    try {
      // Verify estimate exists and contains this EQ
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalQueries ||
        !estimate.externalQueries.some((eqId) => eqId.toString() === id)
      ) {
        throw new NotFoundException(
          `EQ with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const updatedEQ = await this.eqRepository.update(id, eqData);
      if (!updatedEQ) {
        throw new NotFoundException(`EQ with ID ${id} not found`);
      }

      return updatedEQ;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update EQ: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an EQ from an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EQ ID' })
  @ApiResponse({ status: 200, description: 'EQ removed successfully' })
  @ApiResponse({ status: 404, description: 'EQ or estimate not found' })
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
      if (estimate.externalQueries) {
        estimate.externalQueries = estimate.externalQueries.filter(
          (eqId) => eqId.toString() !== id,
        );
        await this.estimateRepository.update(estimateId, {
          externalQueries: estimate.externalQueries,
        });
      }

      // Delete the EQ
      const result = await this.eqRepository.delete(id);
      return { success: result };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove EQ: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
