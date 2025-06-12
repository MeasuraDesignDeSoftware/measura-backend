import { Module } from '@nestjs/common';
import { GQMModule } from '@app/modules/gqm/gqm.module';
import { GQMController } from '@controllers/gqm/gqm.controller';

@Module({
  imports: [GQMModule],
  controllers: [GQMController],
})
export class GQMControllerModule {}
