import { Module } from '@nestjs/common';
import { GoalsModule } from '@app/modules/gqm/goals.module';
import { QuestionsModule } from '@app/modules/gqm/questions.module';
import { MetricsModule } from '@app/modules/gqm/metrics.module';
import { GQMService } from '@application/gqm/use-cases/gqm.service';

@Module({
  imports: [GoalsModule, QuestionsModule, MetricsModule],
  providers: [GQMService],
  exports: [GQMService],
})
export class GQMModule {}
