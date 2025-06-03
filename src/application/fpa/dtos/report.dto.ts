import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({
    description: 'The ID of the estimate to generate a report for',
    example: '5f8d0d55b54764421b71e502',
  })
  @IsString()
  estimateId: string;

  @ApiProperty({
    description: 'Optional format for the report (pdf, json, csv)',
    example: 'pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  format?: string;
}

export class GenerateComparisonReportDto {
  @ApiProperty({
    description: 'The IDs of the estimates to compare',
    example: ['5f8d0d55b54764421b71e502', '5f8d0d55b54764421b71e503'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  estimateIds: string[];

  @ApiProperty({
    description: 'Optional format for the report (pdf, json, csv)',
    example: 'pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  format?: string;
}
