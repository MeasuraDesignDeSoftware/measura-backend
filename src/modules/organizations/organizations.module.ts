import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Organization,
  OrganizationSchema,
} from '@domain/organizations/entities/organization.entity';
import { OrganizationRepository } from '@infrastructure/repositories/organizations/organization.repository';
import { ORGANIZATION_REPOSITORY } from '@domain/organizations/interfaces/organization.repository.interface';
import { OrganizationService } from '@application/organizations/use-cases/organization.service';
import { UsersModule } from '@app/modules/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    UsersModule, // Import UsersModule to access UserService
  ],
  providers: [
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: OrganizationRepository,
    },
    OrganizationService,
  ],
  exports: [ORGANIZATION_REPOSITORY, OrganizationService, UsersModule],
})
export class OrganizationsModule {}
