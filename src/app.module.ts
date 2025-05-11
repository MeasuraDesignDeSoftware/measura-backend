import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { GoalsModule } from './goals.module';
import { AuthModule } from './auth.module';
import appConfig from '@shared/config/app.config';
import { winstonConfig } from '@shared/config/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    MongooseModule.forRootAsync({
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
