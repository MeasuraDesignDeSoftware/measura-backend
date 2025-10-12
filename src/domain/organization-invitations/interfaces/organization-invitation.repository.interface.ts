import { OrganizationInvitation } from '@domain/organization-invitations/entities/organization-invitation.entity';

export const ORGANIZATION_INVITATION_REPOSITORY =
  'ORGANIZATION_INVITATION_REPOSITORY';

export interface IOrganizationInvitationRepository {
  create(
    invitation: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation>;
  findById(id: string): Promise<OrganizationInvitation | null>;
  findPendingByUserId(userId: string): Promise<OrganizationInvitation[]>;
  findByOrganization(organizationId: string): Promise<OrganizationInvitation[]>;
  findByUserIdentifier(
    identifier: string,
  ): Promise<OrganizationInvitation | null>;
  update(
    id: string,
    invitation: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation | null>;
  delete(id: string): Promise<boolean>;
  findPendingByUserIdentifier(
    identifier: string,
  ): Promise<OrganizationInvitation | null>;
  cancelOtherPendingInvitations(
    userIdentifier: string,
    excludeId: string,
  ): Promise<void>;
}
