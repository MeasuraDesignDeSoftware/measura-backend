import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'The email or username of the user to invite',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  userIdentifier: string;
}
