import { Types } from 'mongoose';

export enum PlanStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class Plan {
  _id: Types.ObjectId;
  name: string;
  description: string;
  goalIds: Types.ObjectId[];
  objectiveIds: Types.ObjectId[];
  status: PlanStatus;
  startDate?: Date;
  endDate?: Date;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  organizationId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  constructor(
    name: string,
    description: string,
    goalIds: Types.ObjectId[],
    objectiveIds: Types.ObjectId[],
    createdBy: Types.ObjectId,
    status: PlanStatus = PlanStatus.DRAFT,
    startDate?: Date,
    endDate?: Date,
    organizationId?: Types.ObjectId,
    id?: Types.ObjectId,
    version: number = 1,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id || new Types.ObjectId();
    this.name = name;
    this.description = description;
    this.goalIds = goalIds;
    this.objectiveIds = objectiveIds;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.organizationId = organizationId;
    this.createdBy = createdBy;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.version = version;
  }
}
