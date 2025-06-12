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
import { AIE } from '@domain/fpa/entities/aie.entity';
import {
  AIE_REPOSITORY,
  IAIERepository,
} from '@domain/fpa/interfaces/aie.repository.interface';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { CreateAIEDto } from '@application/fpa/dtos/create-aie.dto';
import { UpdateAIEDto } from '@application/fpa/dtos/components/update-aie.dto';
import { ComplexityCalculator } from '@domain/fpa/services/complexity-calculator.service';

@ApiTags('estimate-components')
@Controller('estimates/:estimateId/eif')
@UseGuards(JwtAuthGuard)
export class AIEController {
  constructor(
    @Inject(AIE_REPOSITORY)
    private readonly aieRepository: IAIERepository,
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add an External Interface File (EIF) to an estimate',
  })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'EIF added successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiBody({ type: CreateAIEDto })
  async create(
    @Param('estimateId') estimateId: string,
    @Body() aieData: CreateAIEDto,
  ): Promise<AIE> {
    try {
      // Verify estimate exists
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      // Calculate complexity and function points using the new calculator
      const { complexity, functionPoints } =
        ComplexityCalculator.calculateEIFComplexity(
          aieData.recordElementTypes,
          aieData.dataElementTypes,
        );

      // Prepare AIE data with calculated values
      const aieToCreate: Partial<AIE> = {
        ...aieData,
        projectId: estimate.projectId,
        complexity,
        functionPoints,
      };

      // Create the AIE component
      const createdAIE = await this.aieRepository.create(aieToCreate);

      // Add reference to the estimate
      if (!estimate.externalInterfaceFiles) {
        estimate.externalInterfaceFiles = [];
      }
      estimate.externalInterfaceFiles.push(createdAIE._id);
      await this.estimateRepository.update(estimateId, {
        externalInterfaceFiles: estimate.externalInterfaceFiles,
      });

      return createdAIE;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add EIF to estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all EIFs for an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all EIFs for the estimate',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async findAll(@Param('estimateId') estimateId: string): Promise<AIE[]> {
    try {
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalInterfaceFiles ||
        estimate.externalInterfaceFiles.length === 0
      ) {
        return [];
      }

      // Convert ObjectIds to strings
      const aieIds = estimate.externalInterfaceFiles.map((id) => id.toString());
      return this.aieRepository.findByIds(aieIds);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EIFs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an EIF by ID' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EIF ID' })
  @ApiResponse({ status: 200, description: 'Returns the EIF' })
  @ApiResponse({ status: 404, description: 'EIF or estimate not found' })
  async findOne(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
  ): Promise<AIE> {
    try {
      // Verify estimate exists and contains this AIE
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalInterfaceFiles ||
        !estimate.externalInterfaceFiles.some(
          (aieId) => aieId.toString() === id,
        )
      ) {
        throw new NotFoundException(
          `EIF with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      const aie = await this.aieRepository.findById(id);
      if (!aie) {
        throw new NotFoundException(`EIF with ID ${id} not found`);
      }

      return aie;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch EIF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an EIF' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EIF ID' })
  @ApiResponse({ status: 200, description: 'EIF updated successfully' })
  @ApiResponse({ status: 404, description: 'EIF or estimate not found' })
  @ApiBody({ type: UpdateAIEDto })
  async update(
    @Param('estimateId') estimateId: string,
    @Param('id') id: string,
    @Body() aieData: UpdateAIEDto,
  ): Promise<AIE> {
    try {
      // Verify estimate exists and contains this AIE
      const estimate = await this.estimateRepository.findById(estimateId);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${estimateId} not found`);
      }

      if (
        !estimate.externalInterfaceFiles ||
        !estimate.externalInterfaceFiles.some(
          (aieId) => aieId.toString() === id,
        )
      ) {
        throw new NotFoundException(
          `EIF with ID ${id} not found in estimate ${estimateId}`,
        );
      }

      // Get current AIE to merge with updates
      const currentAIE = await this.aieRepository.findById(id);
      if (!currentAIE) {
        throw new NotFoundException(`EIF with ID ${id} not found`);
      }

      // Prepare update data with potential complexity recalculation
      const updateData: Partial<AIE> = { ...aieData };

      // Recalculate complexity if RETs or DETs changed
      if (
        aieData.recordElementTypes !== undefined ||
        aieData.dataElementTypes !== undefined
      ) {
        const recordElementTypes =
          aieData.recordElementTypes ?? currentAIE.recordElementTypes;
        const dataElementTypes =
          aieData.dataElementTypes ?? currentAIE.dataElementTypes;

        const { complexity, functionPoints } =
          ComplexityCalculator.calculateEIFComplexity(
            recordElementTypes,
            dataElementTypes,
          );
        updateData.complexity = complexity;
        updateData.functionPoints = functionPoints;
      }

      const updatedAIE = await this.aieRepository.update(id, updateData);
      if (!updatedAIE) {
        throw new NotFoundException(`EIF with ID ${id} not found`);
      }

      return updatedAIE;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update EIF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an EIF from an estimate' })
  @ApiParam({ name: 'estimateId', description: 'The estimate ID' })
  @ApiParam({ name: 'id', description: 'The EIF ID' })
  @ApiResponse({ status: 200, description: 'EIF removed successfully' })
  @ApiResponse({ status: 404, description: 'EIF or estimate not found' })
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
      if (estimate.externalInterfaceFiles) {
        estimate.externalInterfaceFiles =
          estimate.externalInterfaceFiles.filter(
            (aieId) => aieId.toString() !== id,
          );
        await this.estimateRepository.update(estimateId, {
          externalInterfaceFiles: estimate.externalInterfaceFiles,
        });
      }

      // Delete the AIE component
      const result = await this.aieRepository.delete(id);
      if (!result) {
        throw new NotFoundException(`EIF with ID ${id} not found`);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to remove EIF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
