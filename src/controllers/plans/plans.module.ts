import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansController } from '@controllers/plans/plans.controller';
import { PlanExportController } from '@controllers/plans/export.controller';
import { PlanService } from '@application/plans/use-cases/plan.service';
import { PlanExportService } from '@application/plans/use-cases/plan-export.service';
import { PlanSchema } from '@infrastructure/database/mongodb/schemas/plan.schema';
import { PlanRepository } from '@infrastructure/repositories/plans/plan.repository';
import { PLAN_REPOSITORY } from '@domain/plans/interfaces/plan.repository.interface';
import { GoalsModule } from '@app/modules/gqm/goals.module';
import { RootObjectivesModule } from '@app/modules/gqm/objectives.module';
import { QuestionsModule } from '@app/modules/gqm/questions.module';
import { MetricsModule } from '@app/modules/gqm/metrics.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plan', schema: PlanSchema }]),
    GoalsModule,
    RootObjectivesModule,
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
