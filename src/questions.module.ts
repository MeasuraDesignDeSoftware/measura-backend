import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Question,
  QuestionSchema,
} from '@domain/questions/entities/question.entity';
import { QUESTION_REPOSITORY } from '@domain/questions/interfaces/question.repository.interface';
import { QuestionRepository } from '@infrastructure/repositories/questions/question.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  providers: [
    {
      provide: QUESTION_REPOSITORY,
      useClass: QuestionRepository,
    },
  ],
  exports: [QUESTION_REPOSITORY],
})
export class QuestionsModule {}
