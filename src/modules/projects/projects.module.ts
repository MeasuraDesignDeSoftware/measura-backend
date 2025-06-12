import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Project,
  ProjectSchema,
} from '@domain/projects/entities/project.entity';
import { ProjectRepository } from '@infrastructure/repositories/projects/project.repository';
import { PROJECT_REPOSITORY } from '@domain/projects/interfaces/project.repository.interface';
import { ProjectService } from '@application/projects/use-cases/project.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  providers: [
    Logger,
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
    ProjectService,
  ],
  exports: [PROJECT_REPOSITORY, ProjectService],
})
export class ProjectsModule {}
