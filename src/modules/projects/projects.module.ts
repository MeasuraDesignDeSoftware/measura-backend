import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Project,
  ProjectSchema,
} from '@domain/projects/entities/project.entity';
import { ProjectRepository } from '@infrastructure/repositories/projects/project.repository';
import { PROJECT_REPOSITORY } from '@domain/projects/interfaces/project.repository.interface';

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
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectsModule {}
