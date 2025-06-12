export interface IBaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface IProjectScopedRepository<T> extends IBaseRepository<T> {
  findByProject(projectId: string): Promise<T[]>;
}

export interface IBulkRepository<T> extends IBaseRepository<T> {
  findByIds(ids: string[]): Promise<T[]>;
  bulkCreate(entities: Partial<T>[]): Promise<T[]>;
  bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<boolean>;
}
