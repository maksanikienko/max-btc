import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private readonly DEFAULT_WATCHLIST = [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'BNBUSDT',
    'XRPUSDT',
    'ADAUSDT',
    'DOGEUSDT',
    'AVAXUSDT',
    'DOTUSDT',
    'MATICUSDT',
  ];

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('Email or username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, username: dto.username, passwordHash },
    });

    await this.prisma.watchlist.createMany({
      data: this.DEFAULT_WATCHLIST.map((symbol) => ({
        userId: user.id,
        symbol,
      })),
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user.id, user.email);
  }

  async loginWithGoogle(profile: GoogleProfile) {
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      const existing = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      user = existing
        ? await this.prisma.user.update({
            where: { id: existing.id },
            data: {
              googleId: profile.googleId,
              avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
            },
          })
        : await this.createGoogleUser(profile);
    }

    return this.generateTokens(user.id, user.email);
  }

  private async createGoogleUser(profile: GoogleProfile) {
    const username = await this.generateUsername(profile.email, profile.name);
    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        username,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      },
    });

    await this.prisma.watchlist.createMany({
      data: this.DEFAULT_WATCHLIST.map((symbol) => ({
        userId: user.id,
        symbol,
      })),
    });

    return user;
  }

  private async generateUsername(
    email: string,
    name?: string,
  ): Promise<string> {
    const base =
      (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 16) || 'user';

    let username = base.length < 3 ? `user${base}` : base;
    let suffix = 0;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      suffix += 1;
      username = `${base}${suffix}`.slice(0, 20);
    }
    return username;
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.generateTokens(user!.id, user!.email);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('jwt.secret'),
        expiresIn: this.config.getOrThrow<string>('jwt.expiresIn') as any,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.config.getOrThrow<string>(
          'jwt.refreshExpiresIn',
        ) as any,
      }),
    ]);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
    return { accessToken, refreshToken };
  }
}
