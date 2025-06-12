import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateAIEDto {
  @ApiProperty({
    description: 'Name of the External Interface File',
    example: 'Payment Gateway Customer Data',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the AIE',
    example:
      'External customer credit rating data maintained by third-party credit bureau',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Number of Record Element Types (RETs/TRs) - Types of Records',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 8,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  dataElementTypes: number;

  @ApiProperty({
    description:
      'Name or identifier of the external system that maintains this data',
    example: 'Experian Credit Bureau API',
  })
  @IsNotEmpty()
  @IsString()
  externalSystem: string;

  @ApiProperty({
    description:
      'Primary purpose and business function of this External Interface File',
    example:
      'Provides access to external customer credit rating information for loan processing',
  })
  @IsNotEmpty()
  @IsString()
  primaryIntent: string;

  @ApiProperty({
    description:
      'Additional technical notes about the external interface, data format, or access method',
    example:
      'Real-time API access with JSON response format, requires authentication tokens',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
