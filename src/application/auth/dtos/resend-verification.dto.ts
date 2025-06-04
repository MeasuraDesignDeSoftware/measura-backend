import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'The email address to resend verification email to',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
