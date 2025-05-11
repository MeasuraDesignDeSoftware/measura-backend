import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './shared/config/winston.config';
import appConfig from './shared/config/app.config';
import { GoalsModule } from './domain/goals/goals.module';
import { AuthModule } from './domain/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongodb.uri'),
      }),
      inject: [ConfigService],
    }),

    WinstonModule.forRoot(winstonConfig),

    GoalsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
