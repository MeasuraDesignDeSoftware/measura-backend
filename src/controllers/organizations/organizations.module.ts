import { Module } from '@nestjs/common';
import { OrganizationController } from '@controllers/organizations/organization.controller';
import { OrganizationsModule as OrganizationsBusinessModule } from '@app/modules/organizations/organizations.module';
import { UsersModule } from '@app/modules/users/users.module';

@Module({
  imports: [OrganizationsBusinessModule, UsersModule],
  controllers: [OrganizationController],
})
export class OrganizationsControllerModule {}
