import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  create(user: Partial<User>): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
  update(id: string, user: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findByProviderAndEmail(provider: string, email: string): Promise<User | null>;
  updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void>;
  findByRefreshToken(refreshToken: string): Promise<User | null>;
  setResetToken(
    userId: string,
    resetToken: string,
    resetTokenExpires: Date,
  ): Promise<void>;
  findByResetToken(resetToken: string): Promise<User | null>;
  findByVerificationToken(token: string): Promise<User | null>;
  setVerificationToken(userId: string, token: string): Promise<void>;
  markEmailAsVerified(userId: string): Promise<void>;
}
