import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateEIDto {
  @ApiProperty({
    description: 'Name of the External Input transaction',
    example: 'Create Customer Account',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Detailed description of the EI transaction',
    example:
      'Transaction that allows users to create new customer accounts with validation and duplicate checking',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Referenced Files',
    example: 2,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fileTypesReferenced?: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 12,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  dataElementTypes?: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Input transaction',
    example:
      'Allows users to create new customer records with validation and duplicate checking',
    required: false,
  })
  @IsString()
  @IsOptional()
  primaryIntent?: string;

  @ApiProperty({
    description:
      'Processing logic description - what business rules, calculations, or validations are performed',
    example:
      'Validates email format, checks for duplicate customers, assigns customer ID, sends welcome email',
    required: false,
  })
  @IsString()
  @IsOptional()
  processingLogic?: string;

  @ApiProperty({
    description:
      'Additional technical notes about input validation, error handling, or special requirements',
    example:
      'Requires email verification before account activation, implements CAPTCHA for spam prevention',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
