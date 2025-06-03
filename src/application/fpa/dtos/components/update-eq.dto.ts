import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateEQDto {
  @ApiProperty({
    description: 'Name of the External Query',
    example: 'Customer Search',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

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
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fileTypesReferenced?: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DET)',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dataElementTypes?: number;
}
