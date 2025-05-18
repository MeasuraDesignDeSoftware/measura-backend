import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsModule as MetricsDomainModule } from '../../../../metrics.module';

@Module({
  imports: [MetricsDomainModule],
  controllers: [MetricsController],
})
export class MetricsControllerModule {}
