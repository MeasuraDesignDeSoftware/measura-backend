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
  ParseEnumPipe,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { GetUser } from '@shared/utils/decorators/get-user.decorator';
import { ObjectiveService } from '@application/gqm/use-cases/objective.service';
import { CreateObjectiveDto } from '@application/gqm/dtos/create-objective.dto';
import { UpdateObjectiveDto } from '@application/gqm/dtos/update-objective.dto';
import { ObjectiveDto } from '@application/gqm/dtos/objective.dto';
import { ObjectiveStatus } from '@domain/gqm/entities/objective.entity';
import { ParseMongoIdPipe } from '@shared/utils/pipes/parse-mongo-id.pipe';

interface RequestUser {
  id: string;
  [key: string]: any;
}

class UpdateStatusDto {
  status: ObjectiveStatus;
}

@ApiTags('Objectives')
@Controller('objectives')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ObjectivesController {
  private readonly logger = new Logger(ObjectivesController.name);

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
    @GetUser() user: RequestUser,
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
    @GetUser() user: RequestUser,
    @Query('goalId', ParseMongoIdPipe) goalId?: string,
    @Query('organizationId', ParseMongoIdPipe) organizationId?: string,
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve objectives: ${errorMessage}`);
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
  async getObjectiveById(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ObjectiveDto> {
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
    @Param('id', ParseMongoIdPipe) id: string,
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
  @ApiBody({
    description: 'New status for the objective',
    type: UpdateStatusDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Objective status updated successfully',
    type: ObjectiveDto,
  })
  @ApiResponse({ status: 404, description: 'Objective not found' })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  async updateObjectiveStatus(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body(
      'status',
      new ParseEnumPipe(ObjectiveStatus, {
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    status: ObjectiveStatus,
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
    @Param('id', ParseMongoIdPipe) id: string,
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
