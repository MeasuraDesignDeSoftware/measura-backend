import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObjectivesController } from '@controllers/gqm/objectives.controller';
import { ObjectiveService } from '@application/gqm/use-cases/objective.service';
import { ObjectiveSchema } from '@infrastructure/database/mongodb/schemas/objective.schema';
import { ObjectiveRepository } from '@infrastructure/repositories/gqm/objective.repository';
import { OBJECTIVE_REPOSITORY } from '@domain/gqm/interfaces/objective.repository.interface';
import { GoalsModule } from '@app/modules/gqm/goals.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Objective', schema: ObjectiveSchema }]),
    GoalsModule,
  ],
  controllers: [ObjectivesController],
  providers: [
    ObjectiveService,
    {
      provide: OBJECTIVE_REPOSITORY,
      useClass: ObjectiveRepository,
    },
  ],
  exports: [
    ObjectiveService,
    {
      provide: OBJECTIVE_REPOSITORY,
      useClass: ObjectiveRepository,
    },
  ],
})
export class ObjectivesModule {}
