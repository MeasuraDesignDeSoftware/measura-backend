import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Goal, GoalSchema } from '@domain/goals/entities/goal.entity';
import { GoalController } from '@interfaces/api/controllers/goals/goal.controller';
import { GoalService } from '@application/goals/use-cases/goal.service';
import { GoalRepository } from '@infrastructure/repositories/goals/goal.repository';
import { GOAL_REPOSITORY } from '@domain/goals/interfaces/goal.repository.interface';

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
