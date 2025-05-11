import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
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
import { FirebaseAdminService } from '@infrastructure/external-services/firebase/firebase-admin.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
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

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(loginDto.login, loginDto.password);
    return this.generateToken(user);
  }

  async firebaseLogin(
    firebaseLoginDto: FirebaseLoginDto,
  ): Promise<{ accessToken: string }> {
    const decodedToken = await this.firebaseAdminService.verifyIdToken(
      firebaseLoginDto.idToken,
    );
    const { email, name } = decodedToken;

    if (!email) {
      throw new BadRequestException('Email is required for authentication');
    }

    let user = await this.userRepository.findByProviderAndEmail(
      AuthProvider.GOOGLE,
      email,
    );

    if (!user) {
      const username = await this.generateUniqueUsername(
        name || email.split('@')[0],
      );
      user = await this.userRepository.create({
        email,
        username,
        provider: AuthProvider.GOOGLE,
        role: UserRole.USER,
        isActive: true,
      });
    }

    return this.generateToken(user);
  }

  private async generateToken(user: User): Promise<{ accessToken: string }> {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: this.configService.get<string>('app.jwt.expiresIn'),
    });

    return { accessToken };
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
