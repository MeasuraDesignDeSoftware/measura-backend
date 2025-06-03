import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateEODto {
  @ApiProperty({
    description: 'Name of the External Output',
    example: 'Monthly Sales Report',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the External Output',
    example: 'Report that shows sales data by region for the month',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Number of File Types Referenced (FTR)',
    example: 3,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fileTypesReferenced?: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DET)',
    example: 20,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dataElementTypes?: number;
}
