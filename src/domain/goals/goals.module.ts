import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Goal, GoalSchema } from './entities/goal.entity';
import { GoalController } from '../../interfaces/goals/controllers/goal.controller';
import { GoalService } from '../../application/goals/services/goal.service';
import { GoalRepository } from '../../infrastructure/goals/repositories/goal.repository';
import { GOAL_REPOSITORY } from './interfaces/goal.repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
  ],
  controllers: [GoalController],
  providers: [
    GoalService,
    {
      provide: GOAL_REPOSITORY,
      useClass: GoalRepository,
    },
  ],
  exports: [GoalService],
})
export class GoalsModule {}
