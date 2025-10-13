import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@domain/users/entities/user.entity';
import { UserRepository } from '@infrastructure/repositories/users/user.repository';
import { USER_REPOSITORY } from '@domain/users/interfaces/user.repository.interface';
import { UserService } from '@application/users/use-cases/user.service';
import { UserController } from '@controllers/users/user.controller';
import { OrganizationInvitationsModule } from '@app/modules/organization-invitations/organization-invitations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => OrganizationInvitationsModule),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    UserService,
  ],
  exports: [USER_REPOSITORY, UserService],
})
export class UsersModule {}
