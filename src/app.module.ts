import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';

// Business Logic Modules
import { AuthModule } from '@app/modules/auth/auth.module';
import { GQMModule } from '@app/modules/gqm/gqm.module';
import { PlansModule } from '@app/modules/plans/plans.module';
import { ProjectsModule } from '@app/modules/projects/projects.module';
import { FPAModule } from '@app/modules/fpa/fpa.module';
import { UsersModule } from '@app/modules/users/users.module';
import { OrganizationsModule } from '@app/modules/organizations/organizations.module';

// Controller Modules
import { GQMControllerModule } from '@controllers/gqm/gqm.module';
import { MetricsControllerModule } from '@controllers/gqm/metrics.module';
import { ObjectivesModule as ObjectivesControllerModule } from '@controllers/gqm/objectives.module';
import { EstimatesModule } from '@controllers/fpa/estimates.module';
import { EstimatesComponentsModule } from '@controllers/fpa/estimates-components.module';
import { PlansModule as PlansControllerModule } from '@controllers/plans/plans.module';
import { OrganizationsControllerModule } from '@controllers/organizations/organizations.module';
import { ProjectsControllerModule } from '@controllers/projects/projects.module';

// Config Modules
import appConfig from '@app/config/app.config';

import { winstonConfig } from '@app/config/winston.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
      load: [appConfig],
    }),

    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongodb.uri'),
      }),
      inject: [ConfigService],
    }),

    WinstonModule.forRoot(winstonConfig),

    // Business Logic Modules
    AuthModule,
    GQMModule,
    PlansModule,
    ProjectsModule,
    FPAModule,
    UsersModule,
    OrganizationsModule,

    // Controller Modules
    GQMControllerModule,
    MetricsControllerModule,
    ObjectivesControllerModule,
    EstimatesModule,
    EstimatesComponentsModule,
    PlansControllerModule,
    OrganizationsControllerModule,
    ProjectsControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
