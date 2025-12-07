import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private authService: AuthService) {}

  @Get('profile')
  @Roles('user')
  async getUserProfile(@Request() req) {
    const profile = await this.authService.getUserProfile(req.user.id);
    return {
      message: 'Profil utilisateur',
      user: profile
    };
  }

  @Get('dashboard')
  @Roles('user')
  async getUserDashboard(@Request() req) {
    const profile = await this.authService.getUserProfile(req.user.id);
    return {
      message: 'Tableau de bord utilisateur',
      user: profile,
      welcomeMessage: `Bienvenue ${profile.username} !`
    };
  }
}