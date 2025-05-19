import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '@application/auth/use-cases/auth.service';
import { JwtStrategy } from '@interfaces/api/strategies/jwt.strategy';
import { FirebaseAdminService } from '@infrastructure/external-services/firebase/firebase-admin.service';
import { EmailModule } from '@infrastructure/external-services/email/email.module';
import { UsersModule } from './users.module';
import { AuthController } from '@interfaces/api/controllers/auth/auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseAdminService],
  exports: [AuthService],
})
export class AuthModule {}
