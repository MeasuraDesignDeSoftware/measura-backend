import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  AuthProvider,
} from '@domain/users/entities/user.entity';
import { IUserRepository } from '@domain/users/interfaces/user.repository.interface';
import * as crypto from 'crypto';

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private handleError<T>(
    methodName: string,
    error: unknown,
    defaultReturn?: T,
  ): T {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error ? error.stack : new Error(String(error)).stack;

    this.logger.error(`Error in ${methodName}: ${errorMessage}`, errorStack);

    if (defaultReturn !== undefined) {
      return defaultReturn;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }

  async create(user: Partial<User>): Promise<User> {
    try {
      const createdUser = new this.userModel(user);
      return await createdUser.save();
    } catch (error) {
      return this.handleError('create', error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in findById: ${id}`);
        return null;
      }
      return this.userModel.findById(id).exec();
    } catch (error) {
      return this.handleError('findById', error, null);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      if (!email || typeof email !== 'string') {
        this.logger.warn(`Invalid email provided: ${email}`);
        return null;
      }
      return this.userModel.findOne({ email }).exec();
    } catch (error) {
      return this.handleError('findByEmail', error, null);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      if (!username || typeof username !== 'string') {
        this.logger.warn(`Invalid username provided: ${username}`);
        return null;
      }
      return this.userModel.findOne({ username }).exec();
    } catch (error) {
      return this.handleError('findByUsername', error, null);
    }
  }

  async findByEmailOrUsername(login: string): Promise<User | null> {
    try {
      if (!login || typeof login !== 'string') {
        this.logger.warn(`Invalid login provided: ${login}`);
        return null;
      }
      return this.userModel
        .findOne({
          $or: [{ email: login }, { username: login }],
        })
        .exec();
    } catch (error) {
      return this.handleError('findByEmailOrUsername', error, null);
    }
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in update: ${id}`);
        return null;
      }
      return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
    } catch (error) {
      return this.handleError('update', error, null);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in delete: ${id}`);
        return false;
      }
      const objectId = new Types.ObjectId(id);
      const result = await this.userModel.deleteOne({ _id: objectId }).exec();
      return result.deletedCount > 0;
    } catch (error) {
      return this.handleError('delete', error, false);
    }
  }

  async findByProviderAndEmail(
    provider: AuthProvider,
    email: string,
  ): Promise<User | null> {
    try {
      if (!email || typeof email !== 'string' || !provider) {
        this.logger.warn(
          `Invalid input for findByProviderAndEmail: provider=${provider}, email=${email}`,
        );
        return null;
      }
      return this.userModel.findOne({ provider, email }).exec();
    } catch (error) {
      return this.handleError('findByProviderAndEmail', error, null);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return this.userModel.find().exec();
    } catch (error) {
      return this.handleError('findAll', error, []);
    }
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(
          `Invalid ObjectId format in updateRefreshToken: ${userId}`,
        );
        return;
      }

      await this.userModel
        .findByIdAndUpdate(
          userId,
          refreshToken ? { refreshToken } : { $unset: { refreshToken: 1 } },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.handleError('updateRefreshToken', error);
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    try {
      if (!refreshToken || typeof refreshToken !== 'string') {
        this.logger.warn(`Invalid refreshToken provided`);
        return null;
      }
      const hashed = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      return this.userModel.findOne({ refreshToken: hashed }).exec();
    } catch (error) {
      return this.handleError('findByRefreshToken', error, null);
    }
  }

  async findAllWithRefreshTokens(): Promise<User[]> {
    try {
      return this.userModel
        .find({
          refreshToken: { $exists: true, $ne: null },
        })
        .exec();
    } catch (error) {
      return this.handleError('findAllWithRefreshTokens', error, []);
    }
  }

  async setResetToken(
    userId: string,
    resetToken: string,
    resetTokenExpires: Date,
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid ObjectId format in setResetToken: ${userId}`);
        return;
      }

      if (
        !resetToken ||
        typeof resetToken !== 'string' ||
        !(resetTokenExpires instanceof Date)
      ) {
        this.logger.warn(
          `Invalid token data in setResetToken for userId: ${userId}`,
        );
        return;
      }

      const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      await this.userModel
        .findByIdAndUpdate(
          userId,
          { resetToken: hashedResetToken, resetTokenExpires },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.handleError('setResetToken', error);
    }
  }

  async findByResetToken(resetToken: string): Promise<User | null> {
    try {
      if (!resetToken || typeof resetToken !== 'string') {
        this.logger.warn(`Invalid resetToken provided`);
        return null;
      }

      const hashed = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      return this.userModel
        .findOne({
          resetToken: hashed,
          resetTokenExpires: { $gt: new Date() },
        })
        .exec();
    } catch (error) {
      return this.handleError('findByResetToken', error, null);
    }
  }

  async findAllWithResetTokens(): Promise<User[]> {
    try {
      return this.userModel
        .find({
          resetToken: { $exists: true, $ne: null },
          resetTokenExpires: { $gt: new Date() },
        })
        .exec();
    } catch (error) {
      return this.handleError('findAllWithResetTokens', error, []);
    }
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    try {
      if (!token || typeof token !== 'string') {
        this.logger.warn(`Invalid verification token provided`);
        return null;
      }
      return this.userModel
        .findOne({
          verificationToken: { $exists: true, $ne: null },
          verificationTokenExpires: { $gt: new Date() },
        })
        .exec();
    } catch (error) {
      return this.handleError('findByVerificationToken', error, null);
    }
  }

  async findAllWithVerificationTokens(): Promise<User[]> {
    try {
      return this.userModel
        .find({
          verificationToken: { $exists: true, $ne: null },
          verificationTokenExpires: { $gt: new Date() },
        })
        .exec();
    } catch (error) {
      return this.handleError('findAllWithVerificationTokens', error, []);
    }
  }

  async setVerificationToken(
    userId: string,
    token: string,
    tokenExpires: Date,
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(
          `Invalid ObjectId format in setVerificationToken: ${userId}`,
        );
        return;
      }

      if (
        !token ||
        typeof token !== 'string' ||
        !(tokenExpires instanceof Date)
      ) {
        this.logger.warn(
          `Invalid token data in setVerificationToken for userId: ${userId}`,
        );
        return;
      }

      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            verificationToken: token,
            verificationTokenExpires: tokenExpires,
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.handleError('setVerificationToken', error);
    }
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(
          `Invalid ObjectId format in markEmailAsVerified: ${userId}`,
        );
        return;
      }

      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            isEmailVerified: true,
            $unset: { verificationToken: 1, verificationTokenExpires: 1 },
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.handleError('markEmailAsVerified', error);
    }
  }

  async clearResetToken(userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(
          `Invalid ObjectId format in clearResetToken: ${userId}`,
        );
        return;
      }

      await this.userModel
        .findByIdAndUpdate(
          userId,
          { $unset: { resetToken: 1, resetTokenExpires: 1 } },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.handleError('clearResetToken', error);
    }
  }
}
