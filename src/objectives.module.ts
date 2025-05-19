import { Module } from '@nestjs/common';
import { ObjectivesModule } from './interfaces/api/controllers/objectives/objectives.module';

@Module({
  imports: [ObjectivesModule],
  exports: [ObjectivesModule],
})
export class RootObjectivesModule {}
