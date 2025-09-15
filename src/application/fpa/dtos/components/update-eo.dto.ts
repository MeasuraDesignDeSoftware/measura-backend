import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class UpdateEODto {
  @ApiProperty({
    description: 'Name of the External Output transaction',
    example: 'Monthly Account Statement',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Detailed description of the EO transaction',
    example:
      'Generates comprehensive monthly customer statements with transaction history and calculated balances',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Referenced Files',
    example: 3,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fileTypesReferenced?: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 25,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  dataElementTypes?: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Output transaction',
    example:
      'Generates monthly customer statement with account balance, transaction history, and fees',
    required: false,
  })
  @IsString()
  @IsOptional()
  primaryIntent?: string;

  @ApiProperty({
    description: 'Output format and data presentation details',
    example:
      'PDF format with email delivery, includes QR code for digital verification',
    required: false,
  })
  @IsString()
  @IsOptional()
  outputFormat?: string;

  @ApiProperty({
    description:
      'Indicates whether this output produces derived data (calculations, totals, computed fields)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  derivedData?: boolean;

  @ApiProperty({
    description:
      'Additional technical notes about output format, delivery method, or special requirements',
    example:
      'PDF format with email delivery, includes QR code for digital verification',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
