import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Metric, MetricSchema } from '@domain/gqm/entities/metric.entity';
import { METRIC_REPOSITORY } from '@domain/gqm/interfaces/metric.repository.interface';
import { MetricRepository } from '@infrastructure/repositories/gqm/metric.repository';
import { MetricService } from '@application/gqm/use-cases/metric.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metric.name, schema: MetricSchema }]),
  ],
  providers: [
    MetricService,
    Logger,
    {
      provide: METRIC_REPOSITORY,
      useClass: MetricRepository,
    },
  ],
  exports: [METRIC_REPOSITORY, MetricService],
})
export class MetricsModule {}
