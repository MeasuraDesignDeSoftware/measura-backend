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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/utils/guards/roles.guard';
import { Roles } from '@shared/utils/decorators/roles.decorator';
import { UserRole } from '@domain/users/entities/user.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '@application/organizations/dtos';
import { OrganizationService } from '@application/organizations/use-cases/organization.service';
import { UserService } from '@application/users/use-cases/user.service';

interface AuthenticatedRequest {
  user: {
    _id: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'The organization has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 409,
    description: 'Organization name already exists.',
  })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const organization = await this.organizationService.create(
      createOrganizationDto,
      req.user._id,
    );

    // Automatically assign the user to the organization they created
    await this.userService.update(req.user._id, {
      organizationId: organization._id,
    });

    return organization;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all organizations (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Return all organizations.',
  })
  async findAll() {
    return this.organizationService.findAll();
  }

  @Get('my-organization')
  @ApiOperation({ summary: 'Get current user organization' })
  @ApiResponse({
    status: 200,
    description: 'Return the organization of the current user.',
  })
  @ApiResponse({ status: 404, description: 'User has no organization.' })
  async getMyOrganization(@Request() req: AuthenticatedRequest) {
    const user = await this.userService.findOne(req.user._id);
    if (!user.organizationId) {
      return null;
    }

    // Handle invalid organizationId gracefully
    const organization = await this.organizationService.findOne(
      user.organizationId.toString(),
    );
    if (!organization) {
      // If organization not found (possibly due to invalid ID), clear the user's organizationId
      await this.userService.update(req.user._id, {
        organizationId: undefined,
      });
      return null;
    }

    return organization;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by id' })
  @ApiParam({
    name: 'id',
    description: 'The id of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the organization with the specified id.',
  })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  async findOne(@Param('id') id: string) {
    return this.organizationService.findOneOrThrow(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({
    name: 'id',
    description: 'The id of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  @ApiResponse({
    status: 409,
    description: 'Organization name already exists.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an organization (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'The id of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'The organization has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  async remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }

  @Get(':id/objectives')
  @ApiOperation({ summary: 'Get organizational objectives' })
  @ApiParam({
    name: 'id',
    description: 'The id of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Return organizational objectives.',
  })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  async getOrganizationalObjectives(@Param('id') id: string) {
    const organization = await this.organizationService.findOneOrThrow(id);

    // First check for modern objectives array (current format)
    if (organization.objectives && organization.objectives.length > 0) {
      return { data: organization.objectives };
    }

    // Fall back to legacy string format for backward compatibility
    if (!organization.organizationalObjectives) {
      return { data: [] };
    }

    // Parse objectives from string format
    const objectivesText = organization.organizationalObjectives;
    const lines = objectivesText.split('\n').filter((line) => line.trim());

    const objectives = lines.map((line, index) => {
      // Remove numbering patterns like "1)", "1.", "1 -", etc.
      const cleanedTitle = line.replace(/^\s*\d+[).\-\s]\s*/, '').trim();
      return {
        id: `obj-${index + 1}`,
        title: cleanedTitle,
        description: cleanedTitle,
        order: index + 1,
      };
    });

    return { data: objectives };
  }
}
