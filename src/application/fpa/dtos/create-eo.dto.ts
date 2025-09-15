import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateEODto {
  @ApiProperty({
    description: 'Name of the External Output transaction',
    example: 'Monthly Account Statement',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the EO transaction',
    example:
      'Generates comprehensive monthly customer statements with transaction history and calculated balances',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Referenced Files',
    example: 3,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 25,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  dataElementTypes: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Output transaction',
    example:
      'Generates monthly customer statement with account balance, transaction history, and fees',
  })
  @IsNotEmpty()
  @IsString()
  primaryIntent: string;

  @ApiProperty({
    description: 'Output format and data presentation details',
    example:
      'PDF format with email delivery, includes QR code for digital verification',
  })
  @IsNotEmpty()
  @IsString()
  outputFormat: string;

  @ApiProperty({
    description:
      'Indicates whether this output produces derived data (calculations, totals, computed fields)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  derivedData: boolean;

  @ApiProperty({
    description:
      'Additional technical notes about output format, delivery method, or special requirements',
    example:
      'PDF format with email delivery, includes QR code for digital verification',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
