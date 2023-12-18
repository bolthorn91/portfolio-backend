import { JwtService } from 'src/services/jwt.service';
import { Controller, Get, Res, Req, Post, Session, Param, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/shared/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService
  ) {}

  @Get('validate')
  async validate(@Req() req: Request, @Res() res: Response) {
    const isValid = this.jwtService.validateRequestToken(req);
    if (isValid) {
      const response = this.jwtService.decodeRequestToken(req);
      return res.json(response)
    }
    return res.status(400).send('token not valid')
  }
}
