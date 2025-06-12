import { EO } from '@domain/fpa/entities/eo.entity';
import { IBaseFPAComponentRepository } from '@domain/fpa/interfaces/base-fpa-component.repository.interface';

export const EO_REPOSITORY = 'EO_REPOSITORY';

export interface IEORepository extends IBaseFPAComponentRepository<EO> {
  findByAdditionalProcessingFlag(
    hasAdditionalProcessing: boolean,
  ): Promise<EO[]>;
}
