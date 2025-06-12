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
import { Organization } from '@domain/organizations/entities/organization.entity';
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

    const newOrganization = await this.organizationRepository.create({
      ...createOrganizationDto,
      createdBy: new Types.ObjectId(createdBy),
    });

    return newOrganization;
  }

  async findAll(): Promise<Organization[]> {
    return await this.organizationRepository.findAll();
  }

  async findOne(id: string): Promise<Organization> {
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
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

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

    const updatedOrganization = await this.organizationRepository.update(
      id,
      updateOrganizationDto,
    );

    if (!updatedOrganization) {
      throw new NotFoundException(
        `Failed to update organization with ID "${id}"`,
      );
    }

    return updatedOrganization;
  }

  async remove(id: string): Promise<boolean> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    const result = await this.organizationRepository.delete(id);
    if (!result) {
      throw new BadRequestException(
        `Failed to delete organization with ID "${id}"`,
      );
    }

    return true;
  }
}
