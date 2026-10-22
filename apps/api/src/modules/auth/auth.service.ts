import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { LoginInput, RegisterInput, User } from '@asya/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../../common/slugify';
import { ACCESS_TTL_SEC, REFRESH_TTL_SEC } from './auth.constants';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<{ user: User; tokens: Tokens }> {
    const mode = this.config.get('AUTHOR_REGISTRATION', 'invite');
    if (mode === 'invite' && input.inviteCode !== this.config.get('AUTHOR_INVITE_CODE')) {
      throw new ForbiddenException('Регистрация доступна только по приглашению');
    }

    const email = input.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: input.name,
        passwordHash: await argon2.hash(input.password),
        role: 'AUTHOR',
        authorProfile: { create: { slug: uniqueSlug(input.name), displayName: input.name } },
      },
    });
    return { user: toUser(user), tokens: await this.issueTokens(user.id, user.role) };
  }

  async login(input: LoginInput): Promise<{ user: User; tokens: Tokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return { user: toUser(user), tokens: await this.issueTokens(user.id, user.role) };
  }

  /** Ротация: старый refresh-токен отзывается, выдаётся новая пара. */
  async refresh(refreshToken: string | undefined): Promise<Tokens> {
    if (!refreshToken) throw new UnauthorizedException();
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user.id, stored.user.role);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return toUser(user);
  }

  private async issueTokens(userId: string, role: User['role']): Promise<Tokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role },
      { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: ACCESS_TTL_SEC },
    );
    // refresh — случайная строка, в БД храним только её хэш
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
      },
    });
    return { accessToken, refreshToken };
  }
}

function toUser(u: { id: string; email: string; name: string; role: User['role'] }): User {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}
