import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@domain/organization-invitations/entities/organization-invitation.entity';

export class InvitationResponseDto {
  @ApiProperty({ description: 'The unique identifier of the invitation' })
  _id: string;

  @ApiProperty({ description: 'The email or username of the invited user' })
  userIdentifier: string;

  @ApiProperty({ description: 'The organization details' })
  organizationId: {
    _id: string;
    name: string;
    description?: string;
  };

  @ApiProperty({ description: 'The user who sent the invitation' })
  invitedBy: {
    _id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({
    description: 'The status of the invitation',
    enum: InvitationStatus,
  })
  status: InvitationStatus;

  @ApiProperty({ description: 'The date when the invitation was created' })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the invitation was responded to',
    required: false,
  })
  respondedAt?: Date;
}
