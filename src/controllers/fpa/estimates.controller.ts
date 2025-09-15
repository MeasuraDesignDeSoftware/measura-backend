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
  ForbiddenException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from '@shared/utils/pipes/parse-mongo-id.pipe';
import { Estimate } from '@domain/fpa/entities/estimate.entity';
import { CreateEstimateDto } from '@application/fpa/dtos/create-estimate.dto';
import { UpdateEstimateDto } from '@application/fpa/dtos/update-estimate.dto';
import { EstimateService } from '@application/fpa/use-cases/estimate.service';
import {
  FunctionPointCalculator,
  EstimationMetrics,
} from '@domain/fpa/services/function-point-calculator.service';

interface AuthenticatedRequest {
  user: {
    _id: string;
    email: string;
    organizationId: string | null;
  };
}

@ApiTags('Estimates')
@Controller('estimates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EstimatesController {
  constructor(private readonly estimateService: EstimateService) {}

  private validateOrganizationAccess(
    userOrgId: string | null,
    requestedOrgId: string,
  ): void {
    // TEMPORARILY DISABLED: Organization validation bypassed for development
    // if (!userOrgId) {
    //   throw new ForbiddenException(
    //     'You must be assigned to an organization to access estimates. Please contact your administrator to be added to an organization.',
    //   );
    // }
    // if (userOrgId !== requestedOrgId) {
    //   throw new ForbiddenException('Access denied to this organization');
    // }
  }

  @Post(':organizationId')
  @ApiOperation({ summary: 'Create a new estimate' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 201, description: 'Estimate created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  @ApiBody({
    type: CreateEstimateDto,
    description: 'Estimate data to create a new estimate',
  })
  async create(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Body() estimateData: CreateEstimateDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Estimate> {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);

    try {
      return await this.estimateService.create(
        estimateData,
        req.user._id,
        organizationId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to create estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':organizationId')
  @ApiOperation({
    summary: 'Get estimates with pagination and filtering',
  })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Returns organization estimates' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  async findAll(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Request() req: AuthenticatedRequest,
    @Query('projectId') projectId?: string,
  ): Promise<Estimate[]> {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);

    try {
      return await this.estimateService.findAll(organizationId, projectId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch estimates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':organizationId/:id')
  @ApiOperation({ summary: 'Get estimate by id' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 200, description: 'Returns the estimate' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  async findOne(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Estimate> {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);

    try {
      return await this.estimateService.findOne(id, organizationId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Put(':organizationId/:id')
  @ApiOperation({ summary: 'Update an estimate' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 200, description: 'Estimate updated successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  @ApiBody({
    type: UpdateEstimateDto,
    description: 'Updated estimate data',
  })
  async update(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() estimateData: UpdateEstimateDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Estimate> {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);

    try {
      return await this.estimateService.update(
        id,
        estimateData,
        organizationId,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Delete(':organizationId/:id')
  @ApiOperation({ summary: 'Delete an estimate' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 200, description: 'Estimate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  async remove(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);

    try {
      const result = await this.estimateService.remove(id, organizationId);
      return { success: result };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post(':organizationId/:id/version')
  @ApiOperation({ summary: 'Create a new version of an estimate' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({ status: 201, description: 'New version created successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  async createNewVersion(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Estimate> {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);

    try {
      return await this.estimateService.createNewVersion(id, organizationId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create new version: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':organizationId/:id/overview')
  @ApiOperation({ summary: 'Get estimate overview with detailed metrics' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiResponse({
    status: 200,
    description: 'Estimate overview with detailed FPA metrics',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @ApiResponse({ status: 403, description: 'Access denied to organization' })
  async getOverview(
    @Param('organizationId', ParseMongoIdPipe) organizationId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.validateOrganizationAccess(req.user.organizationId, organizationId);
    try {
      const estimate = await this.estimateService.findOne(id, organizationId);

      // Get all components for detailed calculations - Placeholder logic
      // TODO: Replace with actual component repository calls
      const aliComponents =
        estimate.internalLogicalFiles?.map(() => ({
          type: 'ALI',
          functionPoints: 10,
          complexity: 'AVERAGE',
        })) || [];

      const aieComponents =
        estimate.externalInterfaceFiles?.map(() => ({
          type: 'AIE',
          functionPoints: 7,
          complexity: 'AVERAGE',
        })) || [];

      const eiComponents =
        estimate.externalInputs?.map(() => ({
          type: 'EI',
          functionPoints: 4,
          complexity: 'LOW',
        })) || [];

      const eoComponents =
        estimate.externalOutputs?.map(() => ({
          type: 'EO',
          functionPoints: 5,
          complexity: 'AVERAGE',
        })) || [];

      const eqComponents =
        estimate.externalQueries?.map(() => ({
          type: 'EQ',
          functionPoints: 3,
          complexity: 'LOW',
        })) || [];

      // Combine all components
      const allComponents = [
        ...aliComponents,
        ...aieComponents,
        ...eiComponents,
        ...eoComponents,
        ...eqComponents,
      ];

      // Extract function points for calculation
      const componentFunctionPoints = allComponents.map(
        (c) => c.functionPoints,
      );

      // Calculate enhanced FPA metrics using new service
      const metrics = FunctionPointCalculator.calculateEstimationMetrics(
        componentFunctionPoints,
        {
          averageDailyWorkingHours: estimate.averageDailyWorkingHours || 8,
          teamSize: estimate.teamSize || 1,
          hourlyRateBRL: estimate.hourlyRateBRL || 0,
          productivityFactor: estimate.productivityFactor || 10,
          generalSystemCharacteristics: estimate.generalSystemCharacteristics,
        },
      );

      // Calculate breakdowns
      const componentBreakdown =
        FunctionPointCalculator.calculateComponentBreakdown(allComponents);
      const complexityBreakdown =
        FunctionPointCalculator.calculateComplexityBreakdown(allComponents);

      // Calculate percentages for component breakdown
      const componentCounts = {
        ali: {
          count: componentBreakdown.ali.count,
          points: componentBreakdown.ali.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (componentBreakdown.ali.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        aie: {
          count: componentBreakdown.aie.count,
          points: componentBreakdown.aie.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (componentBreakdown.aie.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        ei: {
          count: componentBreakdown.ei.count,
          points: componentBreakdown.ei.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (componentBreakdown.ei.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        eo: {
          count: componentBreakdown.eo.count,
          points: componentBreakdown.eo.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (componentBreakdown.eo.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        eq: {
          count: componentBreakdown.eq.count,
          points: componentBreakdown.eq.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (componentBreakdown.eq.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        total: componentBreakdown.total,
      };

      // Calculate percentages for complexity breakdown
      const complexityDistribution = {
        low: {
          count: complexityBreakdown.low.count,
          points: complexityBreakdown.low.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (complexityBreakdown.low.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        medium: {
          count: complexityBreakdown.average.count,
          points: complexityBreakdown.average.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (complexityBreakdown.average.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
        high: {
          count: complexityBreakdown.high.count,
          points: complexityBreakdown.high.points,
          percentage:
            componentBreakdown.total.points > 0
              ? (complexityBreakdown.high.points /
                  componentBreakdown.total.points) *
                100
              : 0,
        },
      };

      // EQ special calculations analysis
      const eqSpecialCalculations = {
        count: eqComponents.length,
        withDualComplexity: 0, // This would need actual EQ data to determine
        averageInputComplexity: 0,
        averageOutputComplexity: 0,
      };

      // Phase breakdown estimation (industry standard percentages)
      const phaseBreakdown = {
        analysis: {
          hours: metrics.effortHours * 0.15,
          percentage: 15,
        },
        design: {
          hours: metrics.effortHours * 0.2,
          percentage: 20,
        },
        development: {
          hours: metrics.effortHours * 0.4,
          percentage: 40,
        },
        testing: {
          hours: metrics.effortHours * 0.2,
          percentage: 20,
        },
        deployment: {
          hours: metrics.effortHours * 0.05,
          percentage: 5,
        },
      };

      // Cost breakdown
      const costBreakdown = {
        development: metrics.totalCost * 0.7,
        management: metrics.totalCost * 0.15,
        infrastructure: metrics.totalCost * 0.1,
        contingency: metrics.totalCost * 0.05,
      };

      // Productivity metrics
      const productivityMetrics = {
        hoursPerFunctionPoint: metrics.productivityFactor,
        functionPointsPerDay:
          metrics.averageDailyWorkingHours / metrics.productivityFactor,
        functionPointsPerPersonMonth:
          (metrics.averageDailyWorkingHours * 21) / metrics.productivityFactor,
        teamEfficiency: Math.min(1.0, 1.0 / Math.sqrt(metrics.teamSize / 5)), // Brooks' Law approximation
        industryComparison: {
          productivityRating:
            metrics.productivityFactor <= 12
              ? 'HIGH'
              : metrics.productivityFactor <= 18
                ? 'AVERAGE'
                : 'LOW',
          benchmarkHoursPerFP: 15, // Industry average
          performanceIndex: (15 / metrics.productivityFactor) * 100,
        },
      };

      // Risk analysis
      const riskAnalysis = {
        overallRisk: this.calculateOverallRisk(estimate, metrics),
        factors: {
          teamSize: this.analyzeTeamSizeRisk(metrics.teamSize),
          projectDuration: this.analyzeProjectDurationRisk(
            metrics.durationMonths,
          ),
          complexity: this.analyzeComplexityRisk(complexityDistribution),
          productivity: this.analyzeProductivityRisk(
            metrics.productivityFactor,
          ),
        },
        recommendations: this.generateRecommendations(estimate, metrics),
      };

      // Validation and quality score
      const validation = this.validateEstimate(estimate, metrics);

      return {
        // Basic information
        id: estimate._id,
        name: estimate.name,
        description: estimate.description,
        scope: estimate.countingScope,
        countingType: estimate.countType,

        // Project configuration
        projectConfig: {
          averageDailyWorkingHours: estimate.averageDailyWorkingHours || 8,
          teamSize: estimate.teamSize || 1,
          hourlyRateBRL: estimate.hourlyRateBRL || 0,
          productivityFactor: estimate.productivityFactor || 10,
          hasGSC: !!estimate.generalSystemCharacteristics?.length,
        },

        // Function points summary with enhanced details
        functionPointsSummary: {
          pfna: metrics.pfna,
          pfa: metrics.pfa,
          adjustmentFactor: metrics.fa,
          influenceDegree: metrics.ni,
          componentCounts,
          complexityDistribution,
          eqSpecialCalculations,
        },

        // Effort estimation details
        effortEstimation: {
          totalHours: metrics.effortHours,
          durationDays: metrics.durationDays,
          durationWeeks: metrics.durationWeeks,
          durationMonths: metrics.durationMonths,
          hoursPerPerson: metrics.hoursPerPerson,
          phaseBreakdown,
        },

        // Cost estimation details
        costEstimation: {
          totalCost: metrics.totalCost,
          costPerFunctionPoint: metrics.costPerFunctionPoint,
          costPerPerson: metrics.costPerPerson,
          hourlyRate: metrics.hourlyRateBRL,
          costBreakdown,
        },

        // Productivity metrics
        productivityMetrics,

        // Risk analysis
        riskAnalysis,

        // Validation
        validation,

        // Timestamps
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
        lastCalculationAt: new Date(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get estimate overview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Helper methods for risk analysis and validation
  private calculateOverallRisk(
    estimate: Estimate,
    metrics: EstimationMetrics,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Team size risk
    if (metrics.teamSize > 10) riskScore += 2;
    else if (metrics.teamSize > 5) riskScore += 1;

    // Duration risk
    if (metrics.durationMonths > 12) riskScore += 2;
    else if (metrics.durationMonths > 6) riskScore += 1;

    // Productivity risk
    if (metrics.productivityFactor > 20) riskScore += 2;
    else if (metrics.productivityFactor > 15) riskScore += 1;

    // Cost risk
    if (metrics.totalCost > 500000) riskScore += 2;
    else if (metrics.totalCost > 100000) riskScore += 1;

    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private analyzeTeamSizeRisk(teamSize: number): {
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  } {
    if (teamSize <= 3) {
      return {
        risk: 'LOW',
        reason: 'Small team, good communication and coordination',
      };
    } else if (teamSize <= 8) {
      return {
        risk: 'MEDIUM',
        reason: 'Medium-sized team, manageable with proper organization',
      };
    } else {
      return {
        risk: 'HIGH',
        reason:
          'Large team, increased communication overhead and coordination complexity',
      };
    }
  }

  private analyzeProjectDurationRisk(durationMonths: number): {
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  } {
    if (durationMonths <= 3) {
      return {
        risk: 'LOW',
        reason: 'Short project duration, low risk of scope changes',
      };
    } else if (durationMonths <= 12) {
      return {
        risk: 'MEDIUM',
        reason: 'Medium duration, moderate risk of requirement changes',
      };
    } else {
      return {
        risk: 'HIGH',
        reason:
          'Long project duration, high risk of scope creep and technology changes',
      };
    }
  }

  private analyzeComplexityRisk(complexityDist: {
    high: { percentage: number };
  }): { risk: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string } {
    const highComplexityPercentage = complexityDist.high.percentage;

    if (highComplexityPercentage <= 20) {
      return {
        risk: 'LOW',
        reason: 'Most components have low to medium complexity',
      };
    } else if (highComplexityPercentage <= 40) {
      return {
        risk: 'MEDIUM',
        reason: 'Significant portion of high-complexity components',
      };
    } else {
      return {
        risk: 'HIGH',
        reason:
          'High percentage of complex components, increased development risk',
      };
    }
  }

  private analyzeProductivityRisk(productivityFactor: number): {
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  } {
    if (productivityFactor <= 12) {
      return {
        risk: 'LOW',
        reason: 'High productivity factor indicates efficient development',
      };
    } else if (productivityFactor <= 18) {
      return {
        risk: 'MEDIUM',
        reason: 'Average productivity factor for the industry',
      };
    } else {
      return {
        risk: 'HIGH',
        reason:
          'Low productivity factor may indicate technical or organizational challenges',
      };
    }
  }

  private generateRecommendations(
    estimate: Estimate,
    metrics: EstimationMetrics,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.teamSize > 8) {
      recommendations.push(
        'Consider splitting into smaller sub-teams or using agile methodologies to manage large team size',
      );
    }

    if (metrics.durationMonths > 12) {
      recommendations.push(
        'Break project into phases or iterations to reduce risk and improve adaptability',
      );
    }

    if (metrics.productivityFactor > 18) {
      recommendations.push(
        'Review development processes and consider training or tooling improvements to increase productivity',
      );
    }

    if (!estimate.generalSystemCharacteristics?.length) {
      recommendations.push(
        'Consider completing General System Characteristics assessment for more accurate adjustment factor',
      );
    }

    if (metrics.totalCost > 200000) {
      recommendations.push(
        'Implement regular cost monitoring and milestone-based reviews',
      );
    }

    return recommendations;
  }

  private validateEstimate(
    estimate: Estimate,
    metrics: EstimationMetrics,
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    qualityScore: number;
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let qualityScore = 100;

    // Validate required fields
    if (!estimate.teamSize || estimate.teamSize <= 0) {
      errors.push('Team size is required and must be greater than 0');
      qualityScore -= 20;
    }

    if (!estimate.hourlyRateBRL || estimate.hourlyRateBRL <= 0) {
      errors.push('Hourly rate is required and must be greater than 0');
      qualityScore -= 20;
    }

    // Validate logical consistency
    if (metrics.durationDays < 1) {
      warnings.push(
        'Project duration is very short, verify if estimates are realistic',
      );
      qualityScore -= 10;
    }

    if (metrics.productivityFactor < 5) {
      warnings.push('Very high productivity factor, ensure this is achievable');
      qualityScore -= 5;
    }

    if (metrics.productivityFactor > 25) {
      warnings.push(
        'Very low productivity factor, consider if this reflects actual conditions',
      );
      qualityScore -= 5;
    }

    // Validate component counts
    const totalComponents =
      (estimate.internalLogicalFiles?.length || 0) +
      (estimate.externalInterfaceFiles?.length || 0) +
      (estimate.externalInputs?.length || 0) +
      (estimate.externalOutputs?.length || 0) +
      (estimate.externalQueries?.length || 0);

    if (totalComponents === 0) {
      warnings.push('No components defined, estimate may be incomplete');
      qualityScore -= 15;
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      qualityScore: Math.max(0, qualityScore),
    };
  }
}
