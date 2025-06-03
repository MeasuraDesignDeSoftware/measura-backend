import { Module } from '@nestjs/common';
import { MetricsController } from '@controllers/gqm/metrics.controller';
import { MetricsModule as MetricsDomainModule } from '@app/modules/gqm/metrics.module';

@Module({
  imports: [MetricsDomainModule],
  controllers: [MetricsController],
})
export class MetricsControllerModule {}
