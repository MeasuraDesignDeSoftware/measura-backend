import { Question } from '@domain/gqm/entities/question.entity';

export const QUESTION_REPOSITORY = 'QUESTION_REPOSITORY';

export interface IQuestionRepository {
  create(question: Partial<Question>): Promise<Question>;
  findById(id: string): Promise<Question | null>;
  findAll(): Promise<Question[]>;
  update(id: string, question: Partial<Question>): Promise<Question | null>;
  delete(id: string): Promise<boolean>;
  findByGoalId(goalId: string): Promise<Question[]>;
  findByCreatedBy(userId: string): Promise<Question[]>;
}
