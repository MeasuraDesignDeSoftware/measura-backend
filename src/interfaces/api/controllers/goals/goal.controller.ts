import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoalService } from '../../../../application/goals/use-cases/goal.service';
import { CreateGoalDto } from '../../dtos/goals/create-goal.dto';
import { UpdateGoalDto } from '../../dtos/goals/update-goal.dto';
import { Goal } from '../../../../domain/goals/entities/goal.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({
    status: 201,
    description: 'The goal has been successfully created.',
    type: Goal,
  })
  create(
    @Body() createGoalDto: CreateGoalDto,
    @Request() req: ExpressRequest & { user: { _id: string } },
  ) {
    const userId = new Types.ObjectId(req.user._id);
    return this.goalService.create(createGoalDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals' })
  @ApiResponse({
    status: 200,
    description: 'Return all goals.',
    type: [Goal],
  })
  findAll() {
    return this.goalService.findAll();
  }

  @Get('my-goals')
  @ApiOperation({ summary: 'Get all goals created by the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all goals created by the current user.',
    type: [Goal],
  })
  findMyGoals(@Request() req: ExpressRequest & { user: { _id: string } }) {
    const userId = req.user._id;
    return this.goalService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the goal.',
    type: Goal,
  })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  findOne(@Param('id') id: string) {
    return this.goalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiResponse({
    status: 200,
    description: 'The goal has been successfully updated.',
    type: Goal,
  })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  update(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.goalService.update(id, updateGoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiResponse({
    status: 200,
    description: 'The goal has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  remove(@Param('id') id: string) {
    return this.goalService.remove(id);
  }
}
