import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/utils/guards/roles.guard';
import { Roles } from '@shared/utils/decorators/roles.decorator';
import { UserRole } from '@domain/users/entities/user.entity';
import { ProjectService } from '@application/projects/use-cases/project.service';
import { CreateProjectDto, UpdateProjectDto } from '@application/projects/dtos';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter projects by organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all projects.',
  })
  async findAll(@Query('organizationId') organizationId?: string) {
    if (organizationId) {
      return this.projectService.findByOrganization(organizationId);
    }
    return this.projectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiParam({
    name: 'id',
    description: 'The id of the project',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the project with the specified id.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({
    name: 'id',
    description: 'The id of the project',
  })
  @ApiResponse({
    status: 200,
    description: 'The project has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({
    name: 'id',
    description: 'The id of the project',
  })
  @ApiResponse({
    status: 200,
    description: 'The project has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a project' })
  @ApiParam({
    name: 'id',
    description: 'The id of the project',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all versions of the project.',
  })
  async getVersions(@Param('id') id: string) {
    return this.projectService.getVersions(id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new version of a project' })
  @ApiParam({
    name: 'id',
    description: 'The id of the project',
  })
  @ApiResponse({
    status: 201,
    description: 'The project version has been successfully created.',
  })
  async createVersion(@Param('id') id: string): Promise<unknown> {
    return this.projectService.createVersion(id);
  }
}
