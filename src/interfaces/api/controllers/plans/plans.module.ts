import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansController } from './plans.controller';
import { PlanExportController } from './export.controller';
import { PlanService } from '@application/plans/use-cases/plan.service';
import { PlanExportService } from '@application/plans/use-cases/plan-export.service';
import { PlanSchema } from '@infrastructure/database/mongodb/schemas/plan.schema';
import { PlanRepository } from '@infrastructure/database/mongodb/repositories/plan.repository';
import { PLAN_REPOSITORY } from '@domain/plans/interfaces/plan.repository.interface';
import { GoalsModule } from '../../../../goals.module';
import { ObjectivesModule } from '../../../../objectives.module';
import { QuestionsModule } from '../../../../questions.module';
import { MetricsModule } from '../../../../metrics.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plan', schema: PlanSchema }]),
    GoalsModule,
    ObjectivesModule,
    QuestionsModule,
    MetricsModule,
  ],
  controllers: [PlansController, PlanExportController],
  providers: [
    PlanService,
    PlanExportService,
    {
      provide: PLAN_REPOSITORY,
      useClass: PlanRepository,
    },
  ],
  exports: [
    PlanService,
    PlanExportService,
    {
      provide: PLAN_REPOSITORY,
      useClass: PlanRepository,
    },
  ],
})
export class PlansModule {}
