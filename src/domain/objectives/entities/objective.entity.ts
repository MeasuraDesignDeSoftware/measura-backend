import { Types } from 'mongoose';

export enum ObjectiveStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class Objective {
  _id: Types.ObjectId;
  name: string;
  description: string;
  goalIds: Types.ObjectId[];
  status: ObjectiveStatus;
  organizationId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    description: string,
    goalIds: Types.ObjectId[],
    createdBy: Types.ObjectId,
    status: ObjectiveStatus = ObjectiveStatus.DRAFT,
    organizationId?: Types.ObjectId,
    id?: Types.ObjectId,
  ) {
    this._id = id || new Types.ObjectId();
    this.name = name;
    this.description = description;
    this.goalIds = goalIds;
    this.status = status;
    this.organizationId = organizationId;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
