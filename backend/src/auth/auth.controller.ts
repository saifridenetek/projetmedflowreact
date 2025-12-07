import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verifyToken(@Request() req) {
    return {
      valid: true,
      user: req.user,
      message: 'Token valide'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getAllUsers(@Request() req) {
    // Récupérer le tenantId de l'utilisateur connecté
    const currentUser = await this.authService.findUserById(req.user.id);
    
    // Si l'utilisateur est admin, retourner tous les utilisateurs
    if (req.user.role === 'admin') {
      return this.authService.getAllUsers();
    }
    
    // Pour les autres rôles (doctor, receptionist), retourner:
    // - Les utilisateurs de la même clinique (doctors, receptionists avec même tenantId)
    // - TOUS les patients (les patients ne sont pas limités à une clinique)
    if (currentUser && currentUser.tenantId) {
      return this.authService.getUsersForClinicStaff(currentUser.tenantId);
    }
    
    // Si pas de tenantId, retourner seulement les patients
    return this.authService.getUsersByRole('patient');
  }
}