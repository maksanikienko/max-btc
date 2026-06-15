import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import type { GoogleProfile } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: { id: string }) {
    return this.auth.refresh(user.id);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: { id: string }) {
    return this.auth.logout(user.id);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // GoogleAuthGuard redirects to Google's consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @CurrentUser() profile: GoogleProfile,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.auth.loginWithGoogle(profile);
    const frontendUrl = this.config.getOrThrow<string>('frontendUrl');
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  }
}
