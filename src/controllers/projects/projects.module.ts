import { Module } from '@nestjs/common';
import { ProjectController } from '@controllers/projects/project.controller';
import { ProjectsModule as ProjectsBusinessModule } from '@app/modules/projects/projects.module';

@Module({
  imports: [ProjectsBusinessModule],
  controllers: [ProjectController],
})
export class ProjectsControllerModule {}
