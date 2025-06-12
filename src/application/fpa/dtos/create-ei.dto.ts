import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateEIDto {
  @ApiProperty({
    description: 'Name of the External Input transaction',
    example: 'Create Customer Account',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the EI transaction',
    example:
      'Transaction that allows users to create new customer accounts with validation and duplicate checking',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Referenced Files',
    example: 2,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 12,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  dataElementTypes: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Input transaction',
    example:
      'Allows users to create new customer records with validation and duplicate checking',
  })
  @IsNotEmpty()
  @IsString()
  primaryIntent: string;

  @ApiProperty({
    description:
      'Processing logic description - what business rules, calculations, or validations are performed',
    example:
      'Validates email format, checks for duplicate customers, assigns customer ID, sends welcome email',
  })
  @IsNotEmpty()
  @IsString()
  processingLogic: string;

  @ApiProperty({
    description:
      'Additional technical notes about input validation, error handling, or special requirements',
    example:
      'Requires email verification before account activation, implements CAPTCHA for spam prevention',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
