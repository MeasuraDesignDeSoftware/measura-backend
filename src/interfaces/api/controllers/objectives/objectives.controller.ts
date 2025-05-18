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
import { ObjectiveService } from '@application/objectives/use-cases/objective.service';
import { CreateObjectiveDto } from '@domain/objectives/dtos/create-objective.dto';
import { UpdateObjectiveDto } from '@domain/objectives/dtos/update-objective.dto';
import { ObjectiveDto } from '@domain/objectives/dtos/objective.dto';
import { ObjectiveStatus } from '@domain/objectives/entities/objective.entity';

@ApiTags('Objectives')
@Controller('objectives')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ObjectivesController {
  constructor(private readonly objectiveService: ObjectiveService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new measurement objective' })
  @ApiResponse({
    status: 201,
    description: 'Objective created successfully',
    type: ObjectiveDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createObjective(
    @Body() createObjectiveDto: CreateObjectiveDto,
    @GetUser() user: any,
  ): Promise<ObjectiveDto> {
    try {
      return await this.objectiveService.createObjective(
        createObjectiveDto,
        user.id,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create objective');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get objectives based on query parameters' })
  @ApiQuery({
    name: 'goalId',
    required: false,
    description: 'Filter objectives by goal ID',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter objectives by organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Objectives retrieved successfully',
    type: [ObjectiveDto],
  })
  async getObjectives(
    @Query('goalId') goalId?: string,
    @Query('organizationId') organizationId?: string,
    @GetUser() user?: any,
  ): Promise<ObjectiveDto[]> {
    try {
      if (goalId) {
        return await this.objectiveService.getObjectivesByGoalId(goalId);
      } else if (organizationId) {
        return await this.objectiveService.getObjectivesByOrganizationId(
          organizationId,
        );
      } else {
        return await this.objectiveService.getObjectivesByUserId(user.id);
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve objectives');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an objective by ID' })
  @ApiParam({ name: 'id', description: 'Objective ID' })
  @ApiResponse({
    status: 200,
    description: 'Objective retrieved successfully',
    type: ObjectiveDto,
  })
  @ApiResponse({ status: 404, description: 'Objective not found' })
  async getObjectiveById(@Param('id') id: string): Promise<ObjectiveDto> {
    try {
      return await this.objectiveService.getObjectiveById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve objective');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an objective' })
  @ApiParam({ name: 'id', description: 'Objective ID' })
  @ApiResponse({
    status: 200,
    description: 'Objective updated successfully',
    type: ObjectiveDto,
  })
  @ApiResponse({ status: 404, description: 'Objective not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateObjective(
    @Param('id') id: string,
    @Body() updateObjectiveDto: UpdateObjectiveDto,
  ): Promise<ObjectiveDto> {
    try {
      return await this.objectiveService.updateObjective(
        id,
        updateObjectiveDto,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update objective');
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update an objective status' })
  @ApiParam({ name: 'id', description: 'Objective ID' })
  @ApiResponse({
    status: 200,
    description: 'Objective status updated successfully',
    type: ObjectiveDto,
  })
  @ApiResponse({ status: 404, description: 'Objective not found' })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  async updateObjectiveStatus(
    @Param('id') id: string,
    @Body('status') status: ObjectiveStatus,
  ): Promise<ObjectiveDto> {
    try {
      return await this.objectiveService.updateObjectiveStatus(id, status);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update objective status',
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an objective' })
  @ApiParam({ name: 'id', description: 'Objective ID' })
  @ApiResponse({ status: 200, description: 'Objective deleted successfully' })
  @ApiResponse({ status: 404, description: 'Objective not found' })
  async deleteObjective(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.objectiveService.deleteObjective(id);
      return { success: result };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete objective');
    }
  }
}
