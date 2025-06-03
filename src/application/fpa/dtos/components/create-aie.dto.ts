import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAIEDto {
  @ApiProperty({
    description: 'Name of the External Interface File',
    example: 'Payment Gateway System',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the External Interface File',
    example: 'External system that processes payment transactions',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Number of record element types (RETs)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of data element types (DETs)',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  dataElementTypes: number;

  @ApiProperty({
    description: 'Reference to external system or application',
    example: 'Stripe Payment API',
  })
  @IsString()
  externalSystem: string;

  @ApiProperty({
    description: 'Optional notes about this EIF',
    example: 'Used for credit card processing and subscription management',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
