import { Module } from '@nestjs/common';
import { FPAModule } from '@app/modules/fpa/fpa.module';

// Controllers
import { CalculationsController } from '@controllers/fpa/calculations.controller';
import { TrendsController } from '@controllers/fpa/trends.controller';

// Component Controllers
import { ALIController } from '@controllers/fpa/components/ali.controller';
import { AIEController } from '@controllers/fpa/components/aie.controller';
import { EIController } from '@controllers/fpa/components/ei.controller';
import { EOController } from '@controllers/fpa/components/eo.controller';
import { EQController } from '@controllers/fpa/components/eq.controller';

@Module({
  imports: [FPAModule],
  controllers: [
    CalculationsController,
    TrendsController,
    ALIController,
    AIEController,
    EIController,
    EOController,
    EQController,
  ],
})
export class EstimatesComponentsModule {}
