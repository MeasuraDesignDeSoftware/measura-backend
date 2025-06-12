import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  NotFoundException,
  BadRequestException,
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
import { ALI } from '@domain/fpa/entities/ali.entity';
import {
  ALI_REPOSITORY,
  IALIRepository,
} from '@domain/fpa/interfaces/ali.repository.interface';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { CreateALIDto } from '@application/fpa/dtos/create-ali.dto';
import { UpdateALIDto } from '@application/fpa/dtos/components/update-ali.dto';
import { ComplexityCalculator } from '@domain/fpa/services/complexity-calculator.service';

@ApiTags('estimate-components')
@Controller('estimates/:estimateId/ilf')
@UseGuards(JwtAuthGuard)
export class ALIController {
  constructor(
    @Inject(ALI_REPOSITORY)
    private readonly aliRepository: IALIRepository,
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add an Internal Logical File (ILF) to an estimate',
  })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'ILF added successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiBody({ type: CreateALIDto })
  async create(
    @Param('estimateId') estimateId: string,
    @Body() aliData: CreateALIDto,
  ): Promise<ALI> {
    try {
      // Verify estimate exists
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      // Calculate complexity and function points using the new calculator
      const { complexity, functionPoints } =
        ComplexityCalculator.calculateILFComplexity(
          aliData.recordElementTypes,
          aliData.dataElementTypes,
        );

      // Prepare ALI data with calculated values
      const aliToCreate: Partial<ALI> = {
        ...aliData,
        projectId: estimate.projectId,
        complexity,
        functionPoints,
      };

      // Create the ALI component
      const createdALI = await this.aliRepository.create(aliToCreate);

      // Add reference to the estimate
      if (!estimate.internalLogicalFiles) {
        estimate.internalLogicalFiles = [];
      }
      estimate.internalLogicalFiles.push(createdALI._id);
      await this.estimateRepository.update(estimateId, {
        internalLogicalFiles: estimate.internalLogicalFiles,
      });

      return createdALI;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add ILF to estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all ILFs for an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all ILFs for the estimate',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findAll(@Param('estimateId') estimateId: string): Promise<ALI[]> {
    try {
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.internalLogicalFiles ||
        estimate.internalLogicalFiles.length === 0
      ) {
        return [];
      }

      // Convert ObjectIds to strings
      const aliIds = estimate.internalLogicalFiles.map((id) => id.toString());
      return this.aliRepository.findByIds(aliIds);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch ILFs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an ILF by ID' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The ILF ID' })
  @ApiResponse({ status: 200, description: 'Returns the ILF' })
  @ApiResponse({ status: 404, description: 'ILF or estimate not found' })
  async findOne(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
  ): Promise<ALI> {
    try {
      // Verify estimate exists and contains this ALI
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.internalLogicalFiles ||
        !estimate.internalLogicalFiles.some((aliId) => aliId.toString() === id)
      ) {
        throw new NotFoundException(
          `ILF with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const ali = await this.aliRepository.findById(id);
      if (!ali) {
        throw new NotFoundException(`ILF with ID ${id} not found`);
      }

      return ali;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch ILF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an ILF' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The ILF ID' })
  @ApiResponse({ status: 200, description: 'ILF updated successfully' })
  @ApiResponse({ status: 404, description: 'ILF or estimate not found' })
  @ApiBody({ type: UpdateALIDto })
  async update(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
    @Body() aliData: UpdateALIDto,
  ): Promise<ALI> {
    try {
      // Verify estimate exists and contains this ALI
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.internalLogicalFiles ||
        !estimate.internalLogicalFiles.some((aliId) => aliId.toString() === id)
      ) {
        throw new NotFoundException(
          `ILF with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      // Get current ALI to merge with updates
      const currentALI = await this.aliRepository.findById(id);
      if (!currentALI) {
        throw new NotFoundException(`ILF with ID ${id} not found`);
      }

      // Prepare update data with potential complexity recalculation
      const updateData: Partial<ALI> = { ...aliData };

      // Recalculate complexity if RETs or DETs changed
      if (
        aliData.recordElementTypes !== undefined ||
        aliData.dataElementTypes !== undefined
      ) {
        const recordElementTypes =
          aliData.recordElementTypes ?? currentALI.recordElementTypes;
        const dataElementTypes =
          aliData.dataElementTypes ?? currentALI.dataElementTypes;

        const { complexity, functionPoints } =
          ComplexityCalculator.calculateILFComplexity(
            recordElementTypes,
            dataElementTypes,
          );
        updateData.complexity = complexity;
        updateData.functionPoints = functionPoints;
      }

      const updatedALI = await this.aliRepository.update(id, updateData);
      if (!updatedALI) {
        throw new NotFoundException(`ILF with ID ${id} not found`);
      }

      return updatedALI;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update ILF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an ILF from an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The ILF ID' })
  @ApiResponse({ status: 200, description: 'ILF removed successfully' })
  @ApiResponse({ status: 404, description: 'ILF or estimate not found' })
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
      if (estimate.internalLogicalFiles) {
        estimate.internalLogicalFiles = estimate.internalLogicalFiles.filter(
          (aliId) => aliId.toString() !== id,
        );
        await this.estimateRepository.update(estimateId, {
          internalLogicalFiles: estimate.internalLogicalFiles,
        });
      }

      // Delete the ALI component
      const result = await this.aliRepository.delete(id);
      if (!result) {
        throw new NotFoundException(`ILF with ID ${id} not found`);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove ILF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
