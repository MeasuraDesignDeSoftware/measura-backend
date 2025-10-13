import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrganizationInvitation,
  OrganizationInvitationDocument,
  InvitationStatus,
} from '@domain/organization-invitations/entities/organization-invitation.entity';
import { IOrganizationInvitationRepository } from '@domain/organization-invitations/interfaces/organization-invitation.repository.interface';

@Injectable()
export class OrganizationInvitationRepository
  implements IOrganizationInvitationRepository
{
  constructor(
    @InjectModel(OrganizationInvitation.name)
    private invitationModel: Model<OrganizationInvitationDocument>,
  ) {}

  async create(
    invitation: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation> {
    const newInvitation = new this.invitationModel(invitation);
    return newInvitation.save();
  }

  async findById(id: string): Promise<OrganizationInvitation | null> {
    return this.invitationModel
      .findById(id)
      .populate('organizationId', 'name description')
      .populate('invitedBy', 'email username firstName lastName')
      .exec();
  }

  async findPendingByUserId(userId: string): Promise<OrganizationInvitation[]> {
    const User = this.invitationModel.db.model('User');
    const user = await User.findById(userId).exec();

    if (!user) {
      return [];
    }

    return this.invitationModel
      .find({
        userIdentifier: { $in: [user.email, user.username] },
        status: InvitationStatus.PENDING,
      })
      .populate('organizationId', 'name description')
      .populate('invitedBy', 'email username firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<OrganizationInvitation[]> {
    return this.invitationModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .populate('invitedBy', 'email username firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserIdentifier(
    identifier: string,
  ): Promise<OrganizationInvitation | null> {
    return this.invitationModel.findOne({ userIdentifier: identifier }).exec();
  }

  async findPendingByUserIdentifier(
    identifier: string,
  ): Promise<OrganizationInvitation | null> {
    return this.invitationModel
      .findOne({
        userIdentifier: identifier,
        status: InvitationStatus.PENDING,
      })
      .exec();
  }

  async update(
    id: string,
    invitation: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation | null> {
    return this.invitationModel
      .findByIdAndUpdate(id, invitation, { new: true })
      .populate('organizationId', 'name description')
      .populate('invitedBy', 'email username firstName lastName')
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.invitationModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async cancelOtherPendingInvitations(
    userIdentifier: string,
    excludeId: string,
  ): Promise<void> {
    await this.invitationModel
      .updateMany(
        {
          userIdentifier,
          status: InvitationStatus.PENDING,
          _id: { $ne: new Types.ObjectId(excludeId) },
        },
        {
          status: InvitationStatus.CANCELLED,
          respondedAt: new Date(),
        },
      )
      .exec();
  }
}
