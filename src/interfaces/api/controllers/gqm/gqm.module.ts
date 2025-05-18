import { Module } from '@nestjs/common';
import { GQMModule } from '../../../../gqm.module';
import { GQMController } from './gqm.controller';

@Module({
  imports: [GQMModule],
  controllers: [GQMController],
})
export class GQMControllerModule {}
