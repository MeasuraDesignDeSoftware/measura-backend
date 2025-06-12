import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '@domain/organizations/entities/organization.entity';
import { IOrganizationRepository } from '@domain/organizations/interfaces/organization.repository.interface';

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  private readonly logger = new Logger(OrganizationRepository.name);

  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  private handleError<T>(
    methodName: string,
    error: unknown,
    defaultReturn?: T,
  ): T {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error ? error.stack : new Error(String(error)).stack;

    this.logger.error(`Error in ${methodName}: ${errorMessage}`, errorStack);

    if (defaultReturn !== undefined) {
      return defaultReturn;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }

  async create(organization: Partial<Organization>): Promise<Organization> {
    try {
      const createdOrganization = new this.organizationModel(organization);
      return await createdOrganization.save();
    } catch (error) {
      return this.handleError('create', error);
    }
  }

  async findById(id: string): Promise<Organization | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in findById: ${id}`);
        return null;
      }
      return this.organizationModel.findById(id).exec();
    } catch (error) {
      return this.handleError('findById', error, null);
    }
  }

  async findByName(name: string): Promise<Organization | null> {
    try {
      if (!name || typeof name !== 'string') {
        this.logger.warn(`Invalid name provided: ${name}`);
        return null;
      }
      return this.organizationModel.findOne({ name }).exec();
    } catch (error) {
      return this.handleError('findByName', error, null);
    }
  }

  async findByCreatedBy(createdBy: string): Promise<Organization[]> {
    try {
      if (!Types.ObjectId.isValid(createdBy)) {
        this.logger.warn(
          `Invalid ObjectId format in findByCreatedBy: ${createdBy}`,
        );
        return [];
      }
      return this.organizationModel.find({ createdBy }).exec();
    } catch (error) {
      return this.handleError('findByCreatedBy', error, []);
    }
  }

  async findAll(): Promise<Organization[]> {
    try {
      return this.organizationModel.find().exec();
    } catch (error) {
      return this.handleError('findAll', error, []);
    }
  }

  async update(
    id: string,
    organization: Partial<Organization>,
  ): Promise<Organization | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in update: ${id}`);
        return null;
      }
      return this.organizationModel
        .findByIdAndUpdate(id, organization, { new: true })
        .exec();
    } catch (error) {
      return this.handleError('update', error, null);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in delete: ${id}`);
        return false;
      }
      const objectId = new Types.ObjectId(id);
      const result = await this.organizationModel
        .deleteOne({ _id: objectId })
        .exec();
      return result.deletedCount > 0;
    } catch (error) {
      return this.handleError('delete', error, false);
    }
  }
}
