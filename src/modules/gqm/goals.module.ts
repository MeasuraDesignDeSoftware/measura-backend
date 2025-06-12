import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Goal, GoalSchema } from '@domain/gqm/entities/goal.entity';
import { GoalController } from '@controllers/gqm/goal.controller';
import { GoalService } from '@application/gqm/use-cases/goal.service';
import { GoalRepository } from '@infrastructure/repositories/gqm/goal.repository';
import { GOAL_REPOSITORY } from '@domain/gqm/interfaces/goal.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
  ],
  controllers: [GoalController],
  providers: [
    GoalService,
    Logger,
    {
      provide: GOAL_REPOSITORY,
      useClass: GoalRepository,
    },
  ],
  exports: [
    GoalService,
    {
      provide: GOAL_REPOSITORY,
      useClass: GoalRepository,
    },
  ],
})
export class GoalsModule {}
