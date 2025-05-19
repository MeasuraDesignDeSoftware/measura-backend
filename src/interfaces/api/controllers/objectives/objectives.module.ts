import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObjectivesController } from './objectives.controller';
import { ObjectiveService } from '@application/objectives/use-cases/objective.service';
import { ObjectiveSchema } from '@infrastructure/database/mongodb/schemas/objective.schema';
import { ObjectiveRepository } from '@infrastructure/database/mongodb/repositories/objective.repository';
import { OBJECTIVE_REPOSITORY } from '@domain/objectives/interfaces/objective.repository.interface';
import { GoalsModule } from '../../../../goals.module';

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
