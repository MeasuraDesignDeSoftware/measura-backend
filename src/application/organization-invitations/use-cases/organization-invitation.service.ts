import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  ORGANIZATION_INVITATION_REPOSITORY,
  IOrganizationInvitationRepository,
} from '@domain/organization-invitations/interfaces/organization-invitation.repository.interface';
import {
  OrganizationInvitation,
  InvitationStatus,
} from '@domain/organization-invitations/entities/organization-invitation.entity';
import { UserService } from '@application/users/use-cases/user.service';
import { OrganizationService } from '@application/organizations/use-cases/organization.service';
import { Types } from 'mongoose';

@Injectable()
export class OrganizationInvitationService {
  constructor(
    @Inject(ORGANIZATION_INVITATION_REPOSITORY)
    private readonly invitationRepository: IOrganizationInvitationRepository,
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {}

  /**
   * Invite a user to an organization by email or username
   */
  async inviteUser(
    userIdentifier: string,
    organizationId: string,
    invitedByUserId: string,
  ): Promise<OrganizationInvitation> {
    // Validate organization exists
    const organization = await this.organizationService.findOneOrThrow(
      organizationId,
    );

    // Validate inviter belongs to this organization
    const inviter = await this.userService.findOne(invitedByUserId);
    if (
      !inviter.organizationId ||
      inviter.organizationId.toString() !== organizationId
    ) {
      throw new ForbiddenException(
        'You must be a member of the organization to invite users',
      );
    }

    // Try to find user by email or username
    let targetUser;
    try {
      targetUser = await this.userService.findByEmail(userIdentifier);
    } catch (error) {
      // If not found by email, try username
      const allUsers = await this.userService.findAll();
      targetUser = allUsers.find((u) => u.username === userIdentifier);
    }

    if (!targetUser) {
      throw new NotFoundException(
        `User with email or username "${userIdentifier}" not found`,
      );
    }

    // Validate target user doesn't already have an organization
    if (targetUser.organizationId) {
      throw new BadRequestException(
        'User already belongs to an organization',
      );
    }

    // Check if there's already a pending invitation for this user to this org
    const existingInvitation =
      await this.invitationRepository.findPendingByUserIdentifier(
        userIdentifier,
      );

    if (existingInvitation) {
      if (
        existingInvitation.organizationId.toString() === organizationId
      ) {
        throw new ConflictException(
          'A pending invitation already exists for this user to this organization',
        );
      }
    }

    // Create the invitation
    const invitation = await this.invitationRepository.create({
      userIdentifier,
      organizationId: new Types.ObjectId(organizationId),
      invitedBy: new Types.ObjectId(invitedByUserId),
      status: InvitationStatus.PENDING,
    });

    // Return with populated fields
    const populatedInvitation = await this.invitationRepository.findById(
      invitation._id.toString(),
    );

    if (!populatedInvitation) {
      throw new BadRequestException('Failed to create invitation');
    }

    return populatedInvitation;
  }

  /**
   * Get all pending invitations for the current user
   */
  async getMyInvitations(userId: string): Promise<OrganizationInvitation[]> {
    return this.invitationRepository.findPendingByUserId(userId);
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<OrganizationInvitation> {
    // Find the invitation
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Validate invitation is pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept invitation with status: ${invitation.status}`,
      );
    }

    // Validate this invitation is for the current user
    const user = await this.userService.findOne(userId);
    if (
      invitation.userIdentifier !== user.email &&
      invitation.userIdentifier !== user.username
    ) {
      throw new ForbiddenException('This invitation is not for you');
    }

    // Validate user still doesn't have an organization
    if (user.organizationId) {
      throw new BadRequestException(
        'You already belong to an organization. You must leave your current organization before accepting this invitation.',
      );
    }

    // Update user's organization
    await this.userService.update(userId, {
      organizationId: invitation.organizationId,
    });

    // Mark invitation as accepted
    const updatedInvitation = await this.invitationRepository.update(
      invitationId,
      {
        status: InvitationStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    );

    if (!updatedInvitation) {
      throw new BadRequestException('Failed to accept invitation');
    }

    // Cancel any other pending invitations for this user
    await this.invitationRepository.cancelOtherPendingInvitations(
      invitation.userIdentifier,
      invitationId,
    );

    return updatedInvitation;
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(
    invitationId: string,
    userId: string,
  ): Promise<OrganizationInvitation> {
    // Find the invitation
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Validate invitation is pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject invitation with status: ${invitation.status}`,
      );
    }

    // Validate this invitation is for the current user
    const user = await this.userService.findOne(userId);
    if (
      invitation.userIdentifier !== user.email &&
      invitation.userIdentifier !== user.username
    ) {
      throw new ForbiddenException('This invitation is not for you');
    }

    // Mark invitation as rejected
    const updatedInvitation = await this.invitationRepository.update(
      invitationId,
      {
        status: InvitationStatus.REJECTED,
        respondedAt: new Date(),
      },
    );

    if (!updatedInvitation) {
      throw new BadRequestException('Failed to reject invitation');
    }

    return updatedInvitation;
  }

  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(
    organizationId: string,
    requestingUserId: string,
  ): Promise<OrganizationInvitation[]> {
    // Validate requesting user belongs to the organization
    const user = await this.userService.findOne(requestingUserId);
    if (
      !user.organizationId ||
      user.organizationId.toString() !== organizationId
    ) {
      throw new ForbiddenException(
        'You must be a member of the organization to view its invitations',
      );
    }

    return this.invitationRepository.findByOrganization(organizationId);
  }

  /**
   * Cancel an invitation (only by org members)
   */
  async cancelInvitation(
    invitationId: string,
    requestingUserId: string,
  ): Promise<boolean> {
    // Find the invitation
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Validate requesting user belongs to the organization
    const user = await this.userService.findOne(requestingUserId);
    if (
      !user.organizationId ||
      user.organizationId.toString() !== invitation.organizationId.toString()
    ) {
      throw new ForbiddenException(
        'You must be a member of the organization to cancel this invitation',
      );
    }

    // Validate invitation is pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel invitation with status: ${invitation.status}`,
      );
    }

    // Mark as cancelled
    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.CANCELLED,
      respondedAt: new Date(),
    });

    return true;
  }
}
