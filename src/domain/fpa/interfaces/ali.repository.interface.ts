import { ALI } from '@domain/fpa/entities/ali.entity';
import { IBaseFPAComponentRepository } from '@domain/fpa/interfaces/base-fpa-component.repository.interface';

export const ALI_REPOSITORY = 'ALI_REPOSITORY';

export interface IALIRepository extends IBaseFPAComponentRepository<ALI> {
  findByComplexityMetrics(
    recordElementTypes: number,
    dataElementTypes: number,
  ): Promise<ALI[]>;
}
