import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImportPlanDto {
  @ApiProperty({
    description: 'JSON content of the plan to import',
    example:
      '{"plan": {...}, "goals": [...], "objectives": [...], "questions": [...], "metrics": [...]}',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
