import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateEIDto {
  @ApiProperty({
    description: 'Name of the External Input',
    example: 'User Registration Form',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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
  })
  @IsNumber()
  @Min(0)
  fileTypesReferenced: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DET)',
    example: 15,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  dataElementTypes: number;
}
