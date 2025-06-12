import { EQ } from '@domain/fpa/entities/eq.entity';
import { IBaseFPAComponentRepository } from '@domain/fpa/interfaces/base-fpa-component.repository.interface';

export const EQ_REPOSITORY = 'EQ_REPOSITORY';

export interface IEQRepository extends IBaseFPAComponentRepository<EQ> {
  findByComplexityFactors(
    fileTypesReferenced: number,
    totalDataElementTypes: number,
  ): Promise<EQ[]>;
}
