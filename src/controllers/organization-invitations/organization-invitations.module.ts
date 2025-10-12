import { Module } from '@nestjs/common';
import { OrganizationInvitationController } from '@controllers/organization-invitations/organization-invitation.controller';
import { OrganizationInvitationsModule as OrganizationInvitationsBusinessModule } from '@app/modules/organization-invitations/organization-invitations.module';

@Module({
  imports: [OrganizationInvitationsBusinessModule],
  controllers: [OrganizationInvitationController],
})
export class OrganizationInvitationsControllerModule {}
