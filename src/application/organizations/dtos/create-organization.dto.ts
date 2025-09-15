import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrganizationalObjectiveDto } from './organizational-objective.dto';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'The name of the organization',
    example: 'Acme Corporation',
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'The description of the organization',
    example: 'A leading technology company focused on innovation',
    required: false,
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'The website URL of the organization',
    example: 'https://www.acme.com',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiProperty({
    description: 'The industry of the organization',
    example: 'Technology',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Industry must be a string' })
  @MaxLength(100, { message: 'Industry must not exceed 100 characters' })
  industry?: string;

  @ApiProperty({
    description: 'The mission statement of the organization',
    example: 'To innovate and deliver cutting-edge technology solutions',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Mission must be a string' })
  @MaxLength(2000, { message: 'Mission must not exceed 2000 characters' })
  mission?: string;

  @ApiProperty({
    description: 'The vision statement of the organization',
    example: 'To be the global leader in technology innovation',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Vision must be a string' })
  @MaxLength(2000, { message: 'Vision must not exceed 2000 characters' })
  vision?: string;

  @ApiProperty({
    description: 'The core values of the organization',
    example: 'Innovation, Integrity, Excellence, Customer Focus',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Values must be a string' })
  @MaxLength(2000, { message: 'Values must not exceed 2000 characters' })
  values?: string;

  @ApiProperty({
    description: 'The organizational objectives',
    type: [CreateOrganizationalObjectiveDto],
    required: false,
    example: [
      {
        title: 'Increase market share by 25%',
        description: 'Expand customer base through strategic marketing and product improvements',
        priority: 'HIGH',
        status: 'PLANNING',
        targetDate: '2024-12-31T23:59:59.000Z'
      },
      {
        title: 'Launch 3 new product lines',
        description: 'Develop and launch innovative products to diversify our portfolio',
        priority: 'MEDIUM',
        status: 'PLANNING',
        targetDate: '2024-06-30T23:59:59.000Z'
      }
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Objectives must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrganizationalObjectiveDto)
  objectives?: CreateOrganizationalObjectiveDto[];

  @ApiProperty({
    description: 'Legacy organizational objectives (newline-separated list) - DEPRECATED. Use objectives array instead.',
    example:
      '1) Increase market share by 25%\n2) Launch 3 new product lines\n3) Expand to 5 new markets\n4) Achieve 95% customer satisfaction\n5) Reduce operational costs by 15%',
    required: false,
    maxLength: 5000,
    deprecated: true,
  })
  @IsOptional()
  @IsString({ message: 'Organizational objectives must be a string' })
  @MaxLength(5000, {
    message: 'Organizational objectives must not exceed 5000 characters',
  })
  organizationalObjectives?: string;
}
