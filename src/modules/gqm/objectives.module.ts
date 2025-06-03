import { Module } from '@nestjs/common';
import { ObjectivesModule } from '@controllers/gqm/objectives.module';

@Module({
  imports: [ObjectivesModule],
  exports: [ObjectivesModule],
})
export class RootObjectivesModule {}
