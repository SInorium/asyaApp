import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser, type AuthUser } from '../../common/auth.decorators';
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SEC,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_TTL_SEC,
} from './auth.constants';
import { LoginDto, RegisterDto, UserDto } from './auth.dto';
import { AuthService, type Tokens } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ZodResponse({ status: 201, type: UserDto })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.register(dto);
    this.setCookies(res, tokens);
    return user;
  }

  @Post('login')
  @HttpCode(200)
  @ZodResponse({ status: 200, type: UserDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.login(dto);
    this.setCookies(res, tokens);
    return user;
  }

  @Post('refresh')
  @HttpCode(204)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.setCookies(res, await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(ACCESS_COOKIE, this.cookieBase());
    res.clearCookie(REFRESH_COOKIE, { ...this.cookieBase(), path: REFRESH_COOKIE_PATH });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ZodResponse({ status: 200, type: UserDto })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  private cookieBase(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      path: '/',
    };
  }

  private setCookies(res: Response, tokens: Tokens) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.cookieBase(),
      maxAge: ACCESS_TTL_SEC * 1000,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.cookieBase(),
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TTL_SEC * 1000,
    });
  }
}
