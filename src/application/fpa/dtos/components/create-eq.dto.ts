import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateEQDto {
  @ApiProperty({
    description: 'Name of the External Query',
    example: 'Customer Search',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the External Query',
    example: 'Search interface for finding customer records',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Number of File Types Referenced (FTR)',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DET)',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  dataElementTypes: number;
}
