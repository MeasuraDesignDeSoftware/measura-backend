import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateEIDto {
  @ApiProperty({
    description: 'Name of the External Input',
    example: 'User Registration Form',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the External Input',
    example: 'Form for registering new users to the system',
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
    example: 15,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dataElementTypes?: number;
}
