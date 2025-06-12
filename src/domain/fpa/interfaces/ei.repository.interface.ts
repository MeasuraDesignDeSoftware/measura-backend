import { EI } from '@domain/fpa/entities/ei.entity';
import { IBaseFPAComponentRepository } from '@domain/fpa/interfaces/base-fpa-component.repository.interface';

export const EI_REPOSITORY = 'EI_REPOSITORY';

export interface IEIRepository extends IBaseFPAComponentRepository<EI> {
  findByPrimaryIntent(primaryIntent: string): Promise<EI[]>;
}
