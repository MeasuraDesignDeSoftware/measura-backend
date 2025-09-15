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
import { EI } from '@domain/fpa/entities/ei.entity';
import {
  EI_REPOSITORY,
  IEIRepository,
} from '@domain/fpa/interfaces/ei.repository.interface';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { CreateEIDto } from '@application/fpa/dtos/create-ei.dto';
import { UpdateEIDto } from '@application/fpa/dtos/components/update-ei.dto';
import { ComplexityCalculator } from '@domain/fpa/services/complexity-calculator.service';

@ApiTags('estimate-components')
@Controller('estimates/:estimateId/components/ei')
@UseGuards(JwtAuthGuard)
export class EIController {
  constructor(
    @Inject(EI_REPOSITORY)
    private readonly eiRepository: IEIRepository,
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add an External Input (EI) to an estimate',
  })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'EI added successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiBody({ type: CreateEIDto })
  async create(
    @Param('estimateId') estimateId: string,
    @Body() eiData: CreateEIDto,
  ): Promise<EI> {
    try {
      // Verify estimate exists
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      // Calculate complexity and function points using the new calculator
      const { complexity, functionPoints } =
        ComplexityCalculator.calculateEIComplexity(
          eiData.fileTypesReferenced,
          eiData.dataElementTypes,
        );

      // Prepare EI data with calculated values
      const eiToCreate: Partial<EI> = {
        ...eiData,
        projectId: estimate.projectId,
        organizationId: estimate.organizationId, // Add organizationId from estimate
        complexity,
        functionPoints,
      };

      // Create the EI component
      const createdEI = await this.eiRepository.create(eiToCreate);

      // Add reference to the estimate
      if (!estimate.externalInputs) {
        estimate.externalInputs = [];
      }
      estimate.externalInputs.push(createdEI._id);
      await this.estimateRepository.update(estimateId, {
        externalInputs: estimate.externalInputs,
      });

      return createdEI;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add EI to estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all EIs for an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all EIs for the estimate',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findAll(@Param('estimateId') estimateId: string): Promise<EI[]> {
    try {
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (!estimate.externalInputs || estimate.externalInputs.length === 0) {
        return [];
      }

      // Convert ObjectIds to strings
      const eiIds = estimate.externalInputs.map((id) => id.toString());
      return this.eiRepository.findByIds(eiIds);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EIs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an EI by ID' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EI ID' })
  @ApiResponse({ status: 200, description: 'Returns the EI' })
  @ApiResponse({ status: 404, description: 'EI or estimate not found' })
  async findOne(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
  ): Promise<EI> {
    try {
      // Verify estimate exists and contains this EI
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalInputs ||
        !estimate.externalInputs.some((eiId) => eiId.toString() === id)
      ) {
        throw new NotFoundException(
          `EI with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const ei = await this.eiRepository.findById(id);
      if (!ei) {
        throw new NotFoundException(`EI with ID ${id} not found`);
      }

      return ei;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an EI' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EI ID' })
  @ApiResponse({ status: 200, description: 'EI updated successfully' })
  @ApiResponse({ status: 404, description: 'EI or estimate not found' })
  @ApiBody({ type: UpdateEIDto })
  async update(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
    @Body() eiData: UpdateEIDto,
  ): Promise<EI> {
    try {
      // Verify estimate exists and contains this EI
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalInputs ||
        !estimate.externalInputs.some((eiId) => eiId.toString() === id)
      ) {
        throw new NotFoundException(
          `EI with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      // Get current EI to merge with updates
      const currentEI = await this.eiRepository.findById(id);
      if (!currentEI) {
        throw new NotFoundException(`EI with ID ${id} not found`);
      }

      // Prepare update data with potential complexity recalculation
      const updateData: Partial<EI> = { ...eiData };

      // Recalculate complexity if FTRs or DETs changed
      if (
        eiData.fileTypesReferenced !== undefined ||
        eiData.dataElementTypes !== undefined
      ) {
        const fileTypesReferenced =
          eiData.fileTypesReferenced ?? currentEI.fileTypesReferenced;
        const dataElementTypes =
          eiData.dataElementTypes ?? currentEI.dataElementTypes;

        const { complexity, functionPoints } =
          ComplexityCalculator.calculateEIComplexity(
            fileTypesReferenced,
            dataElementTypes,
          );
        updateData.complexity = complexity;
        updateData.functionPoints = functionPoints;
      }

      const updatedEI = await this.eiRepository.update(id, updateData);
      if (!updatedEI) {
        throw new NotFoundException(`EI with ID ${id} not found`);
      }

      return updatedEI;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update EI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an EI from an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EI ID' })
  @ApiResponse({ status: 200, description: 'EI removed successfully' })
  @ApiResponse({ status: 404, description: 'EI or estimate not found' })
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
      if (estimate.externalInputs) {
        estimate.externalInputs = estimate.externalInputs.filter(
          (eiId) => eiId.toString() !== id,
        );
        await this.estimateRepository.update(estimateId, {
          externalInputs: estimate.externalInputs,
        });
      }

      // Delete the EI
      const result = await this.eiRepository.delete(id);
      return { success: result };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove EI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
