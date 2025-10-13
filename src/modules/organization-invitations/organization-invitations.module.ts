import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OrganizationInvitation,
  OrganizationInvitationSchema,
} from '@domain/organization-invitations/entities/organization-invitation.entity';
import { OrganizationInvitationRepository } from '@infrastructure/repositories/organization-invitations/organization-invitation.repository';
import { ORGANIZATION_INVITATION_REPOSITORY } from '@domain/organization-invitations/interfaces/organization-invitation.repository.interface';
import { OrganizationInvitationService } from '@application/organization-invitations/use-cases/organization-invitation.service';
import { UsersModule } from '@app/modules/users/users.module';
import { OrganizationsModule } from '@app/modules/organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OrganizationInvitation.name,
        schema: OrganizationInvitationSchema,
      },
    ]),
    forwardRef(() => UsersModule),
    OrganizationsModule,
  ],
  providers: [
    {
      provide: ORGANIZATION_INVITATION_REPOSITORY,
      useClass: OrganizationInvitationRepository,
    },
    OrganizationInvitationService,
  ],
  exports: [ORGANIZATION_INVITATION_REPOSITORY, OrganizationInvitationService],
})
export class OrganizationInvitationsModule {}
