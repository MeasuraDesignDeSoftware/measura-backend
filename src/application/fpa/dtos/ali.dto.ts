import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { BaseFPAComponentDto } from '@application/fpa/dtos/base-fpa-component.dto';

export class CreateALIDto extends BaseFPAComponentDto {
  @ApiProperty({
    description: 'Number of record element types (RETs)',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of data element types (DETs)',
    example: 15,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  dataElementTypes: number;
}

export class UpdateALIDto extends BaseFPAComponentDto {
  @ApiProperty({
    description: 'Number of record element types (RETs)',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of data element types (DETs)',
    example: 15,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  dataElementTypes: number;
}
