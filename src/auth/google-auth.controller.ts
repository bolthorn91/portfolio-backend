import { ConfigService } from '@nestjs/config';
import { Controller, Get, Res, Req, Post, Query, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Controller('auth/google')
export class GoogleAuthController {
  private googleClientId: string;
  private googleClientSecret
  private googleAuthRedirectUri
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
    ) {
      this.googleClientId = this.configService.get('GOOGLE_OAUTH_CLIENT_ID')
      this.googleClientSecret = this.configService.get('GOOGLE_OAUTH_CLIENT_SECRET')
      this.googleAuthRedirectUri = this.configService.get('GOOGLE_AUTH_REDIRECT_URI')
  }
  @Post('')
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const state = Math.random().toString(36).substring(7);
    ((req as any).session as any).oauthState = state;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${this.googleClientId}&redirect_uri=${this.googleAuthRedirectUri}&scope=profile email&state=${state}`;

    res.redirect(googleAuthUrl);
  }

  @Get('callback')
  async googleAuthCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { code, state } = req.query;
    const storedState = ((req as any).session as any).oauthState;

    if (state !== storedState) {
      return res.status(403).send('Invalid state');
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code.toString(),
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          redirect_uri: this.googleAuthRedirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = await userResponse.json();
    
      const token = await this.jwtService.signAsync(JSON.stringify({
        user,
        accessToken,
      }), {
        secret: this.configService.get('NESTJS_JWT_SECRET'),
      })
      res.redirect(`${this.configService.get('NGROK_FRONT_URI')}?token=${token}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const bearerToken: string = req.headers['authorization'] as string;
    if (bearerToken) {
      const token = bearerToken.replace('Bearer ',''); 
      const { user, accessToken } = this.jwtService.decode(token);
      if (user && accessToken) {
        return res
          .json({user, googleToken: accessToken})
      }
    }
    return res.status(400).send('token not valid')
  }
}
