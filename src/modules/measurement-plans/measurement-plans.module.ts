import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MeasurementPlan,
  MeasurementPlanSchema,
} from '@domain/measurement-plans/entities/measurement-plan.entity';
import { MEASUREMENT_PLAN_REPOSITORY } from '@domain/measurement-plans/interfaces/measurement-plan.repository.interface';
import { MeasurementPlanRepository } from '@infrastructure/repositories/measurement-plans/measurement-plan.repository';
import { MeasurementPlanService } from '@application/measurement-plans/use-cases/measurement-plan.service';
import { ExportService } from '@application/measurement-plans/use-cases/export.service';
import { MeasurementPlansController } from '@controllers/measurement-plans/measurement-plans.controller';
import { MeasurementPlansExportController } from '@controllers/measurement-plans/export.controller';
import { ProjectsModule } from '@modules/projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MeasurementPlan.name,
        schema: MeasurementPlanSchema,
      },
    ]),
    ProjectsModule,
  ],
  controllers: [MeasurementPlansController, MeasurementPlansExportController],
  providers: [
    {
      provide: MEASUREMENT_PLAN_REPOSITORY,
      useClass: MeasurementPlanRepository,
    },
    MeasurementPlanService,
    ExportService,
  ],
  exports: [MeasurementPlanService, MEASUREMENT_PLAN_REPOSITORY],
})
export class MeasurementPlansModule {}
