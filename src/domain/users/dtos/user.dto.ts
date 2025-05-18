import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserDto {
  @ApiProperty({ description: 'Unique identifier for the user' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'Whether the user email is verified' })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: Date;

  static fromEntity(user: User): UserDto {
    if (!user) {
      throw new Error('User entity is required');
    }

    const dto = new UserDto();
    dto.id = user._id ? user._id.toString() : '';
    dto.email = user.email || '';
    dto.firstName = user.username || ''; // Using username as firstName since it's available
    dto.lastName = ''; // No lastName in entity, setting default empty value
    dto.role = user.role || '';
    dto.isEmailVerified = !!user.isEmailVerified;
    dto.createdAt = user.createdAt || new Date();
    dto.updatedAt = user.updatedAt || new Date();
    return dto;
  }
}
