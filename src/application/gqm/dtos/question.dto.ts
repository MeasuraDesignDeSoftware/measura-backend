import { ApiProperty } from '@nestjs/swagger';
import { Question } from '@domain/gqm/entities/question.entity';

export class QuestionDto {
  @ApiProperty({
    description: 'The unique identifier of the question',
    example: '60d21b4667d0d1d8ef9aa87b',
  })
  id: string;

  @ApiProperty({
    description: 'The text of the question',
    example: 'How can we reduce the number of bugs in production?',
  })
  text: string;

  @ApiProperty({
    description: 'The description or context of the question',
    example:
      'This question aims to identify measures to improve code quality and testing processes',
  })
  description: string;

  @ApiProperty({
    description: 'The ID of the goal this question is associated with',
    example: '60d21b4667d0d1d8ef9aa87a',
  })
  goalId: string;

  @ApiProperty({
    description: 'The priority of the question (1-5, with 1 being highest)',
    example: 2,
  })
  priority: number;

  @ApiProperty({
    description: 'The ID of the user who created the question',
    example: '60d21b4667d0d1d8ef9aa87e',
  })
  createdBy: string;

  @ApiProperty({
    description: 'The date when the question was created',
    example: '2023-06-19T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the question was last updated',
    example: '2023-06-20T14:30:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<QuestionDto>) {
    Object.assign(this, partial);
  }
  static fromEntity(question: Question): QuestionDto {
    if (!question) {
      throw new Error(
        'Cannot create QuestionDto from null or undefined question',
      );
    }

    return new QuestionDto({
      id: question._id?.toString(),
      text: question.text,
      description: question.description,
      goalId: question.goalId?.toString(),
      priority: question.priority,
      createdBy: question.createdBy?.toString(),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    });
  }
}
