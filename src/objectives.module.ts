import { Module } from '@nestjs/common';
import { ObjectivesModule as ObjectivesControllerModule } from './interfaces/api/controllers/objectives/objectives.module';

@Module({
  imports: [ObjectivesControllerModule],
  exports: [ObjectivesControllerModule],
})
export class ObjectivesModule {}
