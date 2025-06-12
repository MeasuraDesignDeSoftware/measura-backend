import { AIE } from '@domain/fpa/entities/aie.entity';
import { IBaseFPAComponentRepository } from '@domain/fpa/interfaces/base-fpa-component.repository.interface';

export const AIE_REPOSITORY = 'AIE_REPOSITORY';

export interface IAIERepository extends IBaseFPAComponentRepository<AIE> {
  findByExternalSystem(externalSystem: string): Promise<AIE[]>;
}
