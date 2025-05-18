import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
  AuthProvider,
} from '@domain/users/entities/user.entity';
import { IUserRepository } from '@domain/users/interfaces/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmailOrUsername(login: string): Promise<User | null> {
    return this.userModel
      .findOne({
        $or: [{ email: login }, { username: login }],
      })
      .exec();
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findByProviderAndEmail(
    provider: AuthProvider,
    email: string,
  ): Promise<User | null> {
    return this.userModel.findOne({ provider, email }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshToken }, { new: true })
      .exec();
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.userModel.findOne({ refreshToken }).exec();
  }

  async setResetToken(
    userId: string,
    resetToken: string,
    resetTokenExpires: Date,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(
        userId,
        { resetToken, resetTokenExpires },
        { new: true },
      )
      .exec();
  }

  async findByResetToken(resetToken: string): Promise<User | null> {
    return this.userModel
      .findOne({
        resetToken,
        resetTokenExpires: { $gt: new Date() },
      })
      .exec();
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userModel.findOne({ verificationToken: token }).exec();
  }

  async setVerificationToken(userId: string, token: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { verificationToken: token }, { new: true })
      .exec();
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          isEmailVerified: true,
          verificationToken: undefined,
        },
        { new: true },
      )
      .exec();
  }
}
