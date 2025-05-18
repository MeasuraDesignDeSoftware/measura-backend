import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  AuthProvider,
  UserRole,
} from '@domain/users/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@domain/users/interfaces/user.repository.interface';
import { LoginDto } from '@interfaces/api/dtos/auth/login.dto';
import { FirebaseLoginDto } from '@interfaces/api/dtos/auth/firebase-login.dto';
import { RegisterDto } from '@interfaces/api/dtos/auth/register.dto';
import { RefreshTokenDto } from '@interfaces/api/dtos/auth/refresh-token.dto';
import { PasswordResetRequestDto } from '@interfaces/api/dtos/auth/password-reset-request.dto';
import { PasswordResetDto } from '@interfaces/api/dtos/auth/password-reset.dto';
import { AuthResponseDto } from '@interfaces/api/dtos/auth/auth-response.dto';
import { FirebaseAdminService } from '@infrastructure/external-services/firebase/firebase-admin.service';
import { EmailService } from '@infrastructure/external-services/email/email.service';
import * as admin from 'firebase-admin';

// Specific type for Firebase token content we care about
interface FirebaseAuthUser {
  email: string;
  name?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(login: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmailOrUsername(login);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.provider !== AuthProvider.LOCAL) {
      throw new BadRequestException(
        `This account was created using ${user.provider} authentication`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.login, loginDto.password);
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingEmail = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUsername = await this.userRepository.findByUsername(
      registerDto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    // Generate a verification token directly as a string
    const verificationToken = String(uuidv4());

    // Create the new user
    const newUser = await this.userRepository.create({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: false,
    });

    // Set verification token and send verification email
    if (newUser && newUser._id) {
      const userId = newUser._id.toString();
      await this.userRepository.setVerificationToken(userId, verificationToken);

      // Send verification email
      if (typeof newUser.email === 'string') {
        const emailSent = await this.emailService.sendVerificationEmail(
          newUser.email,
          verificationToken,
        );

        if (!emailSent) {
          this.logger.warn(
            `Failed to send verification email to ${newUser.email}`,
          );
        }
      }
    }

    return this.generateToken(newUser);
  }

  async firebaseLogin(
    firebaseLoginDto: FirebaseLoginDto,
  ): Promise<AuthResponseDto> {
    try {
      // Get the Firebase token data and extract what we need
      const decodedToken = await this.firebaseAdminService.verifyIdToken(
        firebaseLoginDto.idToken,
      );

      // Extract and validate the email
      const firebaseUser = this.extractFirebaseUserInfo(decodedToken);

      // Look up or create the user
      let user = await this.userRepository.findByProviderAndEmail(
        AuthProvider.GOOGLE,
        firebaseUser.email,
      );

      if (!user) {
        // Create a username from the name or email
        const nameBase = firebaseUser.name || firebaseUser.email.split('@')[0];
        const username = await this.generateUniqueUsername(nameBase);

        user = await this.userRepository.create({
          email: firebaseUser.email,
          username,
          provider: AuthProvider.GOOGLE,
          role: UserRole.USER,
          isActive: true,
          isEmailVerified: true, // Email is verified by Google
        });
      }

      return this.generateToken(user);
    } catch (error) {
      this.logger.error(
        `Firebase login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to authenticate with Firebase');
    }
  }

  // Helper to safely extract user info from Firebase token
  private extractFirebaseUserInfo(
    decodedToken: admin.auth.DecodedIdToken,
  ): FirebaseAuthUser {
    const email = decodedToken.email;
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required for authentication');
    }

    // Get name if available
    let name: string | undefined = undefined;
    if (decodedToken.name && typeof decodedToken.name === 'string') {
      name = decodedToken.name;
    }

    return { email, name };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tokenType: string;
      }>(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
      });

      // Check if token is refresh token type
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Find user by ID
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return this.generateToken(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Refresh token error: ${errorMessage}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestPasswordReset(
    passwordResetRequestDto: PasswordResetRequestDto,
  ): Promise<void> {
    const user = await this.userRepository.findByEmail(
      passwordResetRequestDto.email,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.provider !== AuthProvider.LOCAL) {
      throw new BadRequestException(
        `This account was created using ${user.provider} authentication`,
      );
    }

    // Generate a reset token directly as a string
    const resetToken = String(uuidv4());
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token valid for 1 hour

    // Save token to database
    if (user._id && typeof user._id.toString === 'function') {
      const userId = user._id.toString();
      await this.userRepository.setResetToken(
        userId,
        resetToken,
        resetTokenExpires,
      );

      // Send password reset email
      if (typeof user.email === 'string') {
        const emailSent = await this.emailService.sendPasswordResetEmail(
          user.email,
          resetToken,
        );

        if (!emailSent) {
          this.logger.warn(
            `Failed to send password reset email to ${user.email}`,
          );
        }
      }
    }
  }

  async resetPassword(passwordResetDto: PasswordResetDto): Promise<void> {
    const user = await this.userRepository.findByResetToken(
      passwordResetDto.token,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Check if token is expired
    const now = new Date();
    if (user.resetTokenExpires && user.resetTokenExpires < now) {
      throw new UnauthorizedException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordResetDto.password, 10);

    // Update user password and clear reset token
    if (user._id && typeof user._id.toString === 'function') {
      const userId = user._id.toString();
      await this.userRepository.update(userId, {
        password: hashedPassword,
        resetToken: undefined,
        resetTokenExpires: undefined,
      });
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user._id && typeof user._id.toString === 'function') {
      const userId = user._id.toString();
      await this.userRepository.markEmailAsVerified(userId);
    }
  }

  private async generateToken(user: User): Promise<AuthResponseDto> {
    if (!user._id) {
      throw new BadRequestException('Invalid user data for token generation');
    }

    // Use an intermediate non-error typed variable
    const userIdObj = user._id;

    const payload = {
      sub: userIdObj,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: this.configService.get<string>('app.jwt.expiresIn'),
    });

    // Generate refresh token
    const refreshToken = await this.jwtService.signAsync(
      { sub: userIdObj, tokenType: 'refresh' },
      {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('app.jwt.refreshExpiresIn'),
      },
    );

    // Store refresh token hash in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    if (typeof userIdObj.toString === 'function') {
      const userIdString = userIdObj.toString();
      await this.userRepository.updateRefreshToken(
        userIdString,
        refreshTokenHash,
      );
    }

    const expiresInString =
      this.configService.get<string>('app.jwt.expiresIn') || '3600';
    const expiresIn = parseInt(expiresInString);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existingUser = await this.userRepository.findByUsername(username);
      if (!existingUser) {
        isUnique = true;
      } else {
        username = `${baseUsername}${counter}`;
        counter++;
      }
    }

    return username;
  }
}
