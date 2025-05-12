import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@domain/users/entities/user.entity';
import { UserRepository } from '@infrastructure/repositories/users/user.repository';
import { USER_REPOSITORY } from '@domain/users/interfaces/user.repository.interface';
import { UserService } from '@application/users/use-cases/user.service';
import { UserController } from '@interfaces/api/controllers/users/user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
