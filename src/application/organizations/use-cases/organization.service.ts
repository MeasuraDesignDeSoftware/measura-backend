import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '@domain/organizations/interfaces/organization.repository.interface';
import { Organization, OrganizationalObjective, ObjectiveStatus } from '@domain/organizations/entities/organization.entity';
import { CreateOrganizationDto } from '@application/organizations/dtos/create-organization.dto';
import { UpdateOrganizationDto } from '@application/organizations/dtos/update-organization.dto';
import { Types } from 'mongoose';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
    createdBy: string,
  ): Promise<Organization> {
    const existingOrganization = await this.organizationRepository.findByName(
      createOrganizationDto.name,
    );
    if (existingOrganization) {
      throw new ConflictException('Organization name already exists');
    }

    // Convert objectives DTOs to proper OrganizationalObjective entities
    const objectives: OrganizationalObjective[] = createOrganizationDto.objectives?.map(obj => ({
      _id: new Types.ObjectId(),
      title: obj.title,
      description: obj.description,
      priority: obj.priority,
      status: obj.status || ObjectiveStatus.PLANNING,
      targetDate: obj.targetDate,
      progress: obj.progress || 0,
    })) || [];

    const organizationData = {
      ...createOrganizationDto,
      createdBy: new Types.ObjectId(createdBy),
      objectives,
    };

    const newOrganization = await this.organizationRepository.create(organizationData);

    return newOrganization;
  }

  async findAll(): Promise<Organization[]> {
    return await this.organizationRepository.findAll();
  }

  async findOne(id: string): Promise<Organization | null> {
    const organization = await this.organizationRepository.findById(id);
    return organization;
  }

  async findOneOrThrow(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    return organization;
  }

  async findByCreatedBy(createdBy: string): Promise<Organization[]> {
    return await this.organizationRepository.findByCreatedBy(createdBy);
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findOneOrThrow(id);

    if (
      updateOrganizationDto.name &&
      updateOrganizationDto.name !== organization.name
    ) {
      const existingOrganization = await this.organizationRepository.findByName(
        updateOrganizationDto.name,
      );
      if (existingOrganization && existingOrganization._id.toString() !== id) {
        throw new ConflictException('Organization name already exists');
      }
    }

    // Handle objectives update if provided
    let updateData: any = { ...updateOrganizationDto };
    if (updateOrganizationDto.objectives) {
      const objectives: OrganizationalObjective[] = updateOrganizationDto.objectives.map(obj => ({
        _id: (obj as any)._id ? new Types.ObjectId((obj as any)._id) : new Types.ObjectId(),
        title: obj.title!,
        description: obj.description!,
        priority: obj.priority!,
        status: obj.status || ObjectiveStatus.PLANNING,
        targetDate: obj.targetDate,
        completionDate: (obj as any).completionDate,
        progress: obj.progress || 0,
      }));
      updateData.objectives = objectives;
    }

    const updatedOrganization = await this.organizationRepository.update(
      id,
      updateData,
    );

    if (!updatedOrganization) {
      throw new NotFoundException(
        `Failed to update organization with ID "${id}"`,
      );
    }

    return updatedOrganization;
  }

  async remove(id: string): Promise<boolean> {
    const organization = await this.findOneOrThrow(id);

    const result = await this.organizationRepository.delete(id);
    if (!result) {
      throw new BadRequestException(
        `Failed to delete organization with ID "${id}"`,
      );
    }

    return true;
  }

  /**
   * Get all organizational objectives for an organization
   */
  async getObjectives(organizationId: string): Promise<OrganizationalObjective[]> {
    const organization = await this.findOneOrThrow(organizationId);
    return organization.objectives || [];
  }

  /**
   * Get a specific organizational objective by ID
   */
  async getObjective(organizationId: string, objectiveId: string): Promise<OrganizationalObjective> {
    const organization = await this.findOneOrThrow(organizationId);
    const objective = organization.objectives?.find(obj => obj._id.toString() === objectiveId);

    if (!objective) {
      throw new NotFoundException(`Objective with ID "${objectiveId}" not found in organization`);
    }

    return objective;
  }

  /**
   * Add a new objective to an organization
   */
  async addObjective(
    organizationId: string,
    objectiveData: Omit<OrganizationalObjective, '_id'>
  ): Promise<Organization> {
    const organization = await this.findOneOrThrow(organizationId);

    const newObjective: OrganizationalObjective = {
      _id: new Types.ObjectId(),
      ...objectiveData,
    };

    const updatedObjectives = [...(organization.objectives || []), newObjective];

    const updatedOrganization = await this.organizationRepository.update(organizationId, {
      objectives: updatedObjectives,
    });

    if (!updatedOrganization) {
      throw new BadRequestException('Failed to add objective to organization');
    }

    return updatedOrganization;
  }

  /**
   * Update a specific objective in an organization
   */
  async updateObjective(
    organizationId: string,
    objectiveId: string,
    updateData: Partial<OrganizationalObjective>
  ): Promise<Organization> {
    const organization = await this.findOneOrThrow(organizationId);

    const objectiveIndex = organization.objectives?.findIndex(obj => obj._id.toString() === objectiveId);

    if (objectiveIndex === undefined || objectiveIndex === -1) {
      throw new NotFoundException(`Objective with ID "${objectiveId}" not found in organization`);
    }

    const updatedObjectives = [...(organization.objectives || [])];
    updatedObjectives[objectiveIndex] = {
      ...updatedObjectives[objectiveIndex],
      ...updateData,
      _id: new Types.ObjectId(objectiveId), // Preserve the original ID
    };

    const updatedOrganization = await this.organizationRepository.update(organizationId, {
      objectives: updatedObjectives,
    });

    if (!updatedOrganization) {
      throw new BadRequestException('Failed to update objective');
    }

    return updatedOrganization;
  }

  /**
   * Remove an objective from an organization
   */
  async removeObjective(organizationId: string, objectiveId: string): Promise<Organization> {
    const organization = await this.findOneOrThrow(organizationId);

    const updatedObjectives = organization.objectives?.filter(obj => obj._id.toString() !== objectiveId) || [];

    const updatedOrganization = await this.organizationRepository.update(organizationId, {
      objectives: updatedObjectives,
    });

    if (!updatedOrganization) {
      throw new BadRequestException('Failed to remove objective');
    }

    return updatedOrganization;
  }
}
