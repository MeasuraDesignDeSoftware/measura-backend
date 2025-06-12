import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PROJECT_REPOSITORY,
  IProjectRepository,
} from '@domain/projects/interfaces/project.repository.interface';
import { Project } from '@domain/projects/entities/project.entity';
import { CreateProjectDto } from '@application/projects/dtos/create-project.dto';
import { UpdateProjectDto } from '@application/projects/dtos/update-project.dto';
import { Types } from 'mongoose';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    createdBy: string,
  ): Promise<Project> {
    const projectData: Partial<Project> = {
      ...createProjectDto,
      createdBy: new Types.ObjectId(createdBy),
      organizationId: new Types.ObjectId(createProjectDto.organizationId),
      teamMembers:
        createProjectDto.teamMembers?.map((id) => new Types.ObjectId(id)) || [],
    };

    const newProject = await this.projectRepository.create(projectData);
    return newProject;
  }

  async findAll(): Promise<Project[]> {
    return await this.projectRepository.findAll();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }
    return project;
  }

  async findByOrganization(organizationId: string): Promise<Project[]> {
    return await this.projectRepository.findByOrganization(organizationId);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    const updateData: Partial<Project> = {};

    if (updateProjectDto.name !== undefined) {
      updateData.name = updateProjectDto.name;
    }
    if (updateProjectDto.description !== undefined) {
      updateData.description = updateProjectDto.description;
    }
    if (updateProjectDto.status !== undefined) {
      updateData.status = updateProjectDto.status;
    }
    if (updateProjectDto.startDate !== undefined) {
      updateData.startDate = updateProjectDto.startDate;
    }
    if (updateProjectDto.endDate !== undefined) {
      updateData.endDate = updateProjectDto.endDate;
    }
    if (updateProjectDto.organizationId) {
      updateData.organizationId = new Types.ObjectId(
        updateProjectDto.organizationId,
      );
    }
    if (updateProjectDto.teamMembers) {
      updateData.teamMembers = updateProjectDto.teamMembers.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const updatedProject = await this.projectRepository.update(id, updateData);

    if (!updatedProject) {
      throw new NotFoundException(`Failed to update project with ID "${id}"`);
    }

    return updatedProject;
  }

  async remove(id: string): Promise<boolean> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    const result = await this.projectRepository.delete(id);
    if (!result) {
      throw new BadRequestException(`Failed to delete project with ID "${id}"`);
    }

    return true;
  }

  async getVersions(id: string): Promise<any[]> {
    // Placeholder implementation - you can implement versioning logic here
    const project = await this.findOne(id);
    return [
      {
        version: '1.0.0',
        createdAt: project.createdAt,
        description: 'Initial version',
      },
    ];
  }

  async createVersion(id: string): Promise<any> {
    // Placeholder implementation - you can implement versioning logic here
    const project = await this.findOne(id);
    return {
      version: '1.1.0',
      createdAt: new Date(),
      description: 'New version created',
      projectId: project._id,
    };
  }
}
