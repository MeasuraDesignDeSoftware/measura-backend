export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserOwnedEntity extends IBaseEntity {
  createdBy: string;
  updatedBy?: string;
}

export interface IProjectScopedEntity extends IUserOwnedEntity {
  projectId: string;
}

export interface ISoftDeletableEntity extends IBaseEntity {
  deletedAt?: Date;
  isDeleted: boolean;
}
