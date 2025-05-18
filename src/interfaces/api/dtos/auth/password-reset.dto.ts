import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PasswordResetDto {
  @ApiProperty({
    description: 'The password reset token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'The new password',
    example: 'NewStrongPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
