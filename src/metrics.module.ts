import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Metric, MetricSchema } from '@domain/metrics/entities/metric.entity';
import { METRIC_REPOSITORY } from '@domain/metrics/interfaces/metric.repository.interface';
import { MetricRepository } from '@infrastructure/repositories/metrics/metric.repository';
import { MetricService } from '@application/metrics/use-cases/metric.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metric.name, schema: MetricSchema }]),
  ],
  providers: [
    MetricService,
    {
      provide: METRIC_REPOSITORY,
      useClass: MetricRepository,
    },
  ],
  exports: [METRIC_REPOSITORY, MetricService],
})
export class MetricsModule {}
