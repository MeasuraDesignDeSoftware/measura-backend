import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateAIEDto {
  @ApiProperty({
    description: 'Name of the External Interface File',
    example: 'Payment Gateway System',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the External Interface File',
    example: 'External system that processes payment transactions',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Number of record element types (RETs)',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  recordElementTypes?: number;

  @ApiProperty({
    description: 'Number of data element types (DETs)',
    example: 10,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  dataElementTypes?: number;

  @ApiProperty({
    description: 'Reference to external system or application',
    example: 'Stripe Payment API',
    required: false,
  })
  @IsString()
  @IsOptional()
  externalSystem?: string;

  @ApiProperty({
    description: 'Optional notes about this EIF',
    example: 'Used for credit card processing and subscription management',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
