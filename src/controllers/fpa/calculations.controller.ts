import {
  Controller,
  Post,
  Get,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { FunctionPointCalculator } from '@domain/fpa/services/function-point-calculator.service';
import { TeamSizeEstimationService } from '@domain/fpa/services/team-size-estimation.service';
import {
  ALI_REPOSITORY,
  IALIRepository,
} from '@domain/fpa/interfaces/ali.repository.interface';
import {
  AIE_REPOSITORY,
  IAIERepository,
} from '@domain/fpa/interfaces/aie.repository.interface';
import {
  EI_REPOSITORY,
  IEIRepository,
} from '@domain/fpa/interfaces/ei.repository.interface';
import {
  EO_REPOSITORY,
  IEORepository,
} from '@domain/fpa/interfaces/eo.repository.interface';
import {
  EQ_REPOSITORY,
  IEQRepository,
} from '@domain/fpa/interfaces/eq.repository.interface';

interface EffortEstimation {
  adjustedFunctionPoints: number;
  productivityFactor: number;
  estimatedEffortHours: number;
  estimatedEffortDays: number;
  estimatedEffortMonths: number;
}

interface TeamSizeEstimation {
  recommendedTeamSize: number;
  recommendedDurationMonths: number;
  minTeamSize: number;
  maxTeamSize: number;
  minDurationMonths: number;
  maxDurationMonths: number;
}

@ApiTags('estimate-calculations')
@Controller('estimates')
@UseGuards(JwtAuthGuard)
export class CalculationsController {
  constructor(
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
    @Inject(ALI_REPOSITORY)
    private readonly aliRepository: IALIRepository,
    @Inject(AIE_REPOSITORY)
    private readonly aieRepository: IAIERepository,
    @Inject(EI_REPOSITORY)
    private readonly eiRepository: IEIRepository,
    @Inject(EO_REPOSITORY)
    private readonly eoRepository: IEORepository,
    @Inject(EQ_REPOSITORY)
    private readonly eqRepository: IEQRepository,
    private readonly functionPointCalculator: FunctionPointCalculator,
    private readonly teamSizeEstimationService: TeamSizeEstimationService,
  ) {}

  @Post(':id/calculate')
  @ApiOperation({ summary: 'Recalculate function points for an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Function points recalculated successfully',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async recalculateFunctionPoints(@Param('id') id: string) {
    try {
      const estimate = await this.estimateRepository.findById(id);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }

      // Load all components
      const [alis, aies, eis, eos, eqs] = await Promise.all([
        estimate.internalLogicalFiles?.length
          ? this.aliRepository.findByIds(
              estimate.internalLogicalFiles.map((id) => id.toString()),
            )
          : [],
        estimate.externalInterfaceFiles?.length
          ? this.aieRepository.findByIds(
              estimate.externalInterfaceFiles.map((id) => id.toString()),
            )
          : [],
        estimate.externalInputs?.length
          ? this.eiRepository.findByIds(
              estimate.externalInputs.map((id) => id.toString()),
            )
          : [],
        estimate.externalOutputs?.length
          ? this.eoRepository.findByIds(
              estimate.externalOutputs.map((id) => id.toString()),
            )
          : [],
        estimate.externalQueries?.length
          ? this.eqRepository.findByIds(
              estimate.externalQueries.map((id) => id.toString()),
            )
          : [],
      ]);

      // Calculate unadjusted function points
      const unadjustedFP =
        FunctionPointCalculator.calculateUnadjustedFunctionPoints(
          alis.length,
          aies.length,
          eis.length,
          eos.length,
          eqs.length,
        );

      // Calculate value adjustment factor (VAF)
      // Convert numeric GSC values to GeneralSystemCharacteristic objects
      const gscFactors = FunctionPointCalculator.getGSCFactors();
      const gscObjects = estimate.generalSystemCharacteristics.map(
        (value, index) => ({
          name: gscFactors[index].name,
          description: gscFactors[index].description,
          degreeOfInfluence: value,
        }),
      );

      const vaf =
        FunctionPointCalculator.calculateValueAdjustmentFactor(gscObjects);

      // Calculate adjusted function points
      const adjustedFP =
        FunctionPointCalculator.calculateAdjustedFunctionPoints(
          unadjustedFP,
          vaf,
        );

      // Calculate estimated effort
      const effortHours = adjustedFP * estimate.productivityFactor;

      // Update the estimate
      const updatedEstimate = await this.estimateRepository.update(id, {
        unadjustedFunctionPoints: unadjustedFP,
        valueAdjustmentFactor: vaf,
        adjustedFunctionPoints: adjustedFP,
        estimatedEffortHours: effortHours,
      });

      if (!updatedEstimate) {
        throw new NotFoundException(`Failed to update estimate with ID ${id}`);
      }

      return {
        id: updatedEstimate._id,
        unadjustedFunctionPoints: updatedEstimate.unadjustedFunctionPoints,
        valueAdjustmentFactor: updatedEstimate.valueAdjustmentFactor,
        adjustedFunctionPoints: updatedEstimate.adjustedFunctionPoints,
        estimatedEffortHours: updatedEstimate.estimatedEffortHours,
        components: {
          internalLogicalFiles: alis.length,
          externalInterfaceFiles: aies.length,
          externalInputs: eis.length,
          externalOutputs: eos.length,
          externalQueries: eqs.length,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to recalculate function points: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id/effort')
  @ApiOperation({ summary: 'Get effort estimation for an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiQuery({
    name: 'productivityFactor',
    description:
      'Optional custom productivity factor (hours per function point)',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Effort estimation calculated successfully',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async calculateEffort(
    @Param('id') id: string,
    @Query('productivityFactor') productivityFactor?: number,
  ): Promise<EffortEstimation> {
    try {
      const estimate = await this.estimateRepository.findById(id);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }

      // Use provided productivity factor or default to estimate's value
      const usedProductivityFactor =
        productivityFactor || estimate.productivityFactor;

      // Calculate estimated effort
      const estimatedEffortHours =
        estimate.adjustedFunctionPoints * usedProductivityFactor;
      const estimatedEffortDays = estimatedEffortHours / 8; // assuming 8-hour workday
      const estimatedEffortMonths = estimatedEffortDays / 21; // assuming 21 workdays per month

      return {
        adjustedFunctionPoints: estimate.adjustedFunctionPoints,
        productivityFactor: usedProductivityFactor,
        estimatedEffortHours,
        estimatedEffortDays,
        estimatedEffortMonths,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to calculate effort: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id/team-size')
  @ApiOperation({ summary: 'Get team size recommendations for an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiQuery({
    name: 'hoursPerDay',
    description: 'Optional productive hours per person per day',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Team size estimation calculated successfully',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async calculateTeamSize(
    @Param('id') id: string,
    @Query('hoursPerDay') hoursPerDay: number = 6,
  ): Promise<TeamSizeEstimation> {
    try {
      const estimate = await this.estimateRepository.findById(id);
      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }

      // Calculate team size and duration recommendations
      const teamSizeEstimation =
        this.teamSizeEstimationService.estimateTeamSize({
          adjustedFunctionPoints: estimate.adjustedFunctionPoints,
          productivityFactor: estimate.productivityFactor,
          hoursPerDayPerPerson: hoursPerDay,
        });

      return {
        recommendedTeamSize: teamSizeEstimation.recommendedTeamSize,
        recommendedDurationMonths: teamSizeEstimation.recommendedDurationMonths,
        minTeamSize: teamSizeEstimation.minTeamSize,
        maxTeamSize: teamSizeEstimation.maxTeamSize,
        minDurationMonths: teamSizeEstimation.minDurationMonths,
        maxDurationMonths: teamSizeEstimation.maxDurationMonths,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to calculate team size: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
