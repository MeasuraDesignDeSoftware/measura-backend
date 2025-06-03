import { Module } from '@nestjs/common';
import { PlansModule as PlansControllerModule } from '@controllers/plans/plans.module';

@Module({
  imports: [PlansControllerModule],
  exports: [PlansControllerModule],
})
export class PlansModule {}
