import { Module } from '@nestjs/common';
import { GoalsModule } from './goals.module';
import { QuestionsModule } from './questions.module';
import { MetricsModule } from './metrics.module';
import { GQMService } from '@application/gqm/use-cases/gqm.service';

@Module({
  imports: [GoalsModule, QuestionsModule, MetricsModule],
  providers: [GQMService],
  exports: [GQMService],
})
export class GQMModule {}
