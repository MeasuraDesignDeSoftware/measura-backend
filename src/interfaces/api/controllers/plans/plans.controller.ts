import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@interfaces/api/guards/jwt-auth.guard';
import { GetUser } from '@interfaces/api/decorators/get-user.decorator';
import { PlanService } from '@application/plans/use-cases/plan.service';
import { CreatePlanDto } from '@domain/plans/dtos/create-plan.dto';
import { UpdatePlanDto } from '@domain/plans/dtos/update-plan.dto';
import { PlanDto } from '@domain/plans/dtos/plan.dto';
import { ParseMongoIdPipe } from '@shared/utils/pipes/parse-mongo-id.pipe';

interface RequestUser {
  id: string;
  [key: string]: any;
}

@ApiTags('Plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new measurement plan' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: PlanDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict with existing data' })
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @GetUser() user: RequestUser,
  ): Promise<PlanDto> {
    try {
      return await this.planService.createPlan(createPlanDto, user.id);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create plan');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get plans based on query parameters' })
  @ApiQuery({
    name: 'goalId',
    required: false,
    description: 'Filter plans by goal ID',
  })
  @ApiQuery({
    name: 'objectiveId',
    required: false,
    description: 'Filter plans by objective ID',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter plans by organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
    type: [PlanDto],
  })
  async getPlans(
    @GetUser() user: RequestUser,
    @Query('goalId', new ParseMongoIdPipe()) goalId?: string,
    @Query('objectiveId', new ParseMongoIdPipe()) objectiveId?: string,
    @Query('organizationId', new ParseMongoIdPipe()) organizationId?: string,
  ): Promise<PlanDto[]> {
    try {
      if (goalId) {
        return await this.planService.getPlansByGoalId(goalId);
      }

      if (objectiveId) {
        return await this.planService.getPlansByObjectiveId(objectiveId);
      }

      if (organizationId) {
        return await this.planService.getPlansByOrganizationId(organizationId);
      }

      return await this.planService.getPlansByUserId(user.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve plans');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
    type: PlanDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<PlanDto> {
    try {
      return await this.planService.getPlanById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve plan');
    }
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan versions retrieved successfully',
    type: [PlanDto],
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanVersions(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<PlanDto[]> {
    try {
      return await this.planService.getPlanVersions(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve plan versions',
      );
    }
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new version of a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 201,
    description: 'New plan version created successfully',
    type: PlanDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Conflict with existing data' })
  async createNewVersion(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<PlanDto> {
    try {
      return await this.planService.createNewVersion(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create new plan version',
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: PlanDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict with existing data' })
  async updatePlan(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<PlanDto> {
    try {
      return await this.planService.updatePlan(id, updatePlanDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update plan');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 204, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete approved or active plan',
  })
  async deletePlan(@Param('id', ParseMongoIdPipe) id: string): Promise<void> {
    try {
      await this.planService.deletePlan(id);
      return;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete plan');
    }
  }
}
