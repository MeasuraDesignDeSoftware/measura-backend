import { BaseFPAComponent } from '@domain/fpa/entities/base-fpa-component.entity';

export interface IBaseFPAComponentRepository<T extends BaseFPAComponent> {
  create(component: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findByIds(ids: string[]): Promise<T[]>;
  findByProject(projectId: string): Promise<T[]>;
  findAll(): Promise<T[]>;
  update(id: string, component: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
