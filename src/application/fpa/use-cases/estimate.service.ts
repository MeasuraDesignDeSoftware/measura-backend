import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { Estimate, EstimateStatus } from '@domain/fpa/entities/estimate.entity';
import { CreateEstimateDto } from '../dtos/create-estimate.dto';
import { UpdateEstimateDto } from '../dtos/update-estimate.dto';
import { ProjectService } from '@application/projects/use-cases/project.service';

@Injectable()
export class EstimateService {
  constructor(
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
    private readonly projectService: ProjectService,
  ) {}

  async create(
    createDto: CreateEstimateDto,
    userId: string,
    organizationId: string,
  ): Promise<Estimate> {
    // Validate that the project belongs to the same organization
    const project = await this.projectService.findOne(createDto.projectId);
    if (project.organizationId.toString() !== organizationId) {
      throw new ForbiddenException(
        'Cannot create estimate for project from different organization',
      );
    }

    // Check if project already has an estimate
    if (project.estimateId) {
      throw new BadRequestException(
        'Project already has an associated estimate. Each project can have only one estimate.',
      );
    }

    const estimate: Partial<Estimate> = {
      ...createDto,
      createdBy: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      projectId: new Types.ObjectId(createDto.projectId),
      status: EstimateStatus.DRAFT,
      version: 1,
      // Convert string arrays to ObjectId arrays
      internalLogicalFiles: createDto.internalLogicalFiles?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalInterfaceFiles: createDto.externalInterfaceFiles?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalInputs: createDto.externalInputs?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalOutputs: createDto.externalOutputs?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalQueries: createDto.externalQueries?.map(
        (id) => new Types.ObjectId(id),
      ),
    };

    const createdEstimate = await this.estimateRepository.create(estimate);

    // Auto-link the estimate to the project
    if (createDto.projectId) {
      try {
        const project = await this.projectService.findOne(createDto.projectId);

        // Ensure project belongs to the same organization
        if (project.organizationId.toString() === organizationId) {
          await this.projectService.update(createDto.projectId, {
            estimateId: createdEstimate._id.toString(),
          });
        }
      } catch (error) {
        // If project linking fails, log error but don't fail the estimate creation
        console.warn('Failed to link estimate to project:', error);
      }
    }

    return createdEstimate;
  }

  async findAll(
    organizationId: string,
    projectId?: string,
  ): Promise<Estimate[]> {
    if (projectId) {
      return await this.estimateRepository.findByProject(projectId);
    }
    return await this.estimateRepository.findAll();
  }

  async findOne(id: string, organizationId: string): Promise<Estimate> {
    const estimate = await this.estimateRepository.findById(id);
    if (!estimate) {
      throw new NotFoundException(`Estimate with ID ${id} not found`);
    }

    // Ensure estimate belongs to the requested organization
    if (estimate.organizationId.toString() !== organizationId) {
      throw new ForbiddenException('Access denied to this estimate');
    }

    return estimate;
  }

  async update(
    id: string,
    updateDto: UpdateEstimateDto,
    organizationId: string,
  ): Promise<Estimate> {
    await this.findOne(id, organizationId);

    // Convert string arrays to ObjectId arrays for update
    const updateData: Partial<Estimate> = {
      ...updateDto,
      internalLogicalFiles: updateDto.internalLogicalFiles?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalInterfaceFiles: updateDto.externalInterfaceFiles?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalInputs: updateDto.externalInputs?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalOutputs: updateDto.externalOutputs?.map(
        (id) => new Types.ObjectId(id),
      ),
      externalQueries: updateDto.externalQueries?.map(
        (id) => new Types.ObjectId(id),
      ),
    };

    const updatedEstimate = await this.estimateRepository.update(
      id,
      updateData,
    );
    if (!updatedEstimate) {
      throw new NotFoundException(`Failed to update estimate with ID ${id}`);
    }
    return updatedEstimate;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const existingEstimate = await this.findOne(id, organizationId);

    // Unlink from project before deletion
    if (existingEstimate.projectId) {
      try {
        await this.projectService.update(
          existingEstimate.projectId.toString(),
          {
            estimateId: undefined,
          },
        );
      } catch (error) {
        // If project unlinking fails, log error but continue with deletion
        console.warn('Failed to unlink estimate from project:', error);
      }
    }

    const result = await this.estimateRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`Failed to delete estimate with ID ${id}`);
    }
    return true;
  }

  async createNewVersion(
    id: string,
    organizationId: string,
  ): Promise<Estimate> {
    await this.findOne(id, organizationId);

    const newVersion = await this.estimateRepository.createNewVersion(id);
    if (!newVersion) {
      throw new NotFoundException(
        `Failed to create new version for estimate ${id}`,
      );
    }
    return newVersion;
  }
}
