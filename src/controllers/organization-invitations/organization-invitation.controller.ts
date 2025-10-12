import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import { OrganizationInvitationService } from '@application/organization-invitations/use-cases/organization-invitation.service';
import { CreateInvitationDto } from '@application/organization-invitations/dtos';
import { UserRole } from '@domain/users/entities/user.entity';

interface AuthenticatedRequest {
  user: {
    _id: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

@ApiTags('Organization Invitations')
@Controller('organization-invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationInvitationController {
  constructor(
    private readonly invitationService: OrganizationInvitationService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Invite a user to your organization',
    description:
      'Invite a user by email or username. You must be a member of an organization to send invitations.',
  })
  @ApiResponse({
    status: 201,
    description: 'The invitation has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user already has organization or invalid data.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you must be a member of an organization.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - invitation already exists.',
  })
  async inviteUser(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user.organizationId) {
      throw new Error('You must belong to an organization to invite users');
    }

    return this.invitationService.inviteUser(
      createInvitationDto.userIdentifier,
      req.user.organizationId,
      req.user._id,
    );
  }

  @Get('my-invitations')
  @ApiOperation({
    summary: 'Get your pending invitations',
    description:
      'Returns all pending invitations sent to your email or username.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of pending invitations.',
  })
  async getMyInvitations(@Request() req: AuthenticatedRequest) {
    return this.invitationService.getMyInvitations(req.user._id);
  }

  @Post(':id/accept')
  @ApiOperation({
    summary: 'Accept an invitation',
    description:
      'Accept an invitation to join an organization. You must not already belong to an organization.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the invitation',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - you already have an organization or invitation is not pending.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - this invitation is not for you.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found.',
  })
  async acceptInvitation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.invitationService.acceptInvitation(id, req.user._id);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject an invitation',
    description: 'Reject an invitation to join an organization.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the invitation',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation rejected successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invitation is not pending.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - this invitation is not for you.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found.',
  })
  async rejectInvitation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.invitationService.rejectInvitation(id, req.user._id);
  }

  @Get('organizations/:orgId/invitations')
  @ApiOperation({
    summary: 'Get all invitations for an organization',
    description:
      'Returns all invitations (pending, accepted, rejected, cancelled) for the specified organization. You must be a member of the organization.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'The ID of the organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of invitations for the organization.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - you must be a member of the organization to view its invitations.',
  })
  async getOrganizationInvitations(
    @Param('orgId') orgId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.invitationService.getOrganizationInvitations(
      orgId,
      req.user._id,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel a pending invitation',
    description:
      'Cancel a pending invitation. You must be a member of the organization that sent the invitation.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the invitation',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation cancelled successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invitation is not pending.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - you must be a member of the organization to cancel this invitation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found.',
  })
  async cancelInvitation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.invitationService.cancelInvitation(id, req.user._id);
  }
}
