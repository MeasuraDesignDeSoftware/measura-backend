import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateAIEDto {
  @ApiProperty({
    description: 'Name of the External Interface File',
    example: 'Payment Gateway Customer Data',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Detailed description of the AIE',
    example:
      'External customer credit rating data maintained by third-party credit bureau',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Number of Record Element Types (RETs/TRs) - Types of Records',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  recordElementTypes?: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 8,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  dataElementTypes?: number;

  @ApiProperty({
    description:
      'Name or identifier of the external system that maintains this data',
    example: 'Experian Credit Bureau API',
    required: false,
  })
  @IsString()
  @IsOptional()
  externalSystem?: string;

  @ApiProperty({
    description:
      'Primary purpose and business function of this External Interface File',
    example:
      'Provides access to external customer credit rating information for loan processing',
    required: false,
  })
  @IsString()
  @IsOptional()
  primaryIntent?: string;

  @ApiProperty({
    description:
      'Additional technical notes about the external interface, data format, or access method',
    example:
      'Real-time API access with JSON response format, requires authentication tokens',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
