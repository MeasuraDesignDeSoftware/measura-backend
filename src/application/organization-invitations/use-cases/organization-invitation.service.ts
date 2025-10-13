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

  async inviteUser(
    userIdentifier: string,
    organizationId: string,
    invitedByUserId: string,
  ): Promise<OrganizationInvitation> {
    const organization =
      await this.organizationService.findOneOrThrow(organizationId);

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

    const existingInvitation =
      await this.invitationRepository.findPendingByUserIdentifier(
        userIdentifier,
      );

    if (existingInvitation) {
      if (existingInvitation.organizationId.toString() === organizationId) {
        throw new ConflictException(
          'A pending invitation already exists for this user to this organization',
        );
      }
    }

    const invitation = await this.invitationRepository.create({
      userIdentifier,
      organizationId: new Types.ObjectId(organizationId),
      invitedBy: new Types.ObjectId(invitedByUserId),
      status: InvitationStatus.PENDING,
    });

    const populatedInvitation = await this.invitationRepository.findById(
      invitation._id.toString(),
    );

    if (!populatedInvitation) {
      throw new BadRequestException('Failed to create invitation');
    }

    return populatedInvitation;
  }

  async getMyInvitations(userId: string): Promise<OrganizationInvitation[]> {
    return this.invitationRepository.findPendingByUserId(userId);
  }

  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<OrganizationInvitation> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept invitation with status: ${invitation.status}`,
      );
    }

    const user = await this.userService.findOne(userId);
    if (
      invitation.userIdentifier !== user.email &&
      invitation.userIdentifier !== user.username
    ) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (user.organizationId) {
      throw new BadRequestException(
        'You already belong to an organization. You must leave your current organization before accepting this invitation.',
      );
    }

    await this.userService.update(userId, {
      organizationId: invitation.organizationId,
    });

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

    await this.invitationRepository.cancelOtherPendingInvitations(
      invitation.userIdentifier,
      invitationId,
    );

    return updatedInvitation;
  }

  async rejectInvitation(
    invitationId: string,
    userId: string,
  ): Promise<OrganizationInvitation> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject invitation with status: ${invitation.status}`,
      );
    }

    const user = await this.userService.findOne(userId);
    if (
      invitation.userIdentifier !== user.email &&
      invitation.userIdentifier !== user.username
    ) {
      throw new ForbiddenException('This invitation is not for you');
    }

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

  async getOrganizationInvitations(
    organizationId: string,
    requestingUserId: string,
  ): Promise<OrganizationInvitation[]> {
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

  async cancelInvitation(
    invitationId: string,
    requestingUserId: string,
  ): Promise<boolean> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.userService.findOne(requestingUserId);
    if (
      !user.organizationId ||
      user.organizationId.toString() !== invitation.organizationId.toString()
    ) {
      throw new ForbiddenException(
        'You must be a member of the organization to cancel this invitation',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel invitation with status: ${invitation.status}`,
      );
    }

    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.CANCELLED,
      respondedAt: new Date(),
    });

    return true;
  }
}
