import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/auth.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private authService: AuthService) {}

  @Get('users')
  @Roles('admin')
  async getAllUsers() {
    const users = await this.authService.getAllUsers();
    return {
      message: 'Liste de tous les utilisateurs',
      users: users,
      count: users.length
    };
  }

  @Get('dashboard')
  @Roles('admin')
  async getAdminDashboard() {
    const users = await this.authService.getAllUsers();
    
    // Statistiques par rôle pour le système médical
    const stats = {
      totalUsers: users.length,
      doctors: users.filter(user => user.role === 'doctor').length,
      patients: users.filter(user => user.role === 'patient').length,
      receptionists: users.filter(user => user.role === 'receptionist').length,
      admins: users.filter(user => user.role === 'admin').length
    };

    // Utilisateurs récents (dernière semaine)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentUsers = users.filter(user => 
      new Date(user.createdAt) >= oneWeekAgo
    ).slice(-10);

    // Médecins par spécialité
    const doctorsBySpecialty = users
      .filter(user => user.role === 'doctor' && user.specialty)
      .reduce((acc, doctor) => {
        acc[doctor.specialty] = (acc[doctor.specialty] || 0) + 1;
        return acc;
      }, {});

    return {
      message: 'Tableau de bord administrateur MedFlow',
      stats,
      recentUsers,
      doctorsBySpecialty,
      lastUpdated: new Date()
    };
  }

  @Post('users')
  @Roles('admin')
  async createUser(@Body() userData: RegisterDto, @Request() req) {
    const result = await this.authService.register(userData);
    return {
      message: 'Utilisateur créé avec succès',
      user: result.user,
      createdBy: req.user.email
    };
  }

  @Put('users/:id')
  @Roles('admin')
  async updateUser(
    @Param('id') userId: number,
    @Body() updateData: any,
    @Request() req
  ) {
    const updatedUser = await this.authService.updateUser(userId, updateData);
    return {
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser,
      updatedBy: req.user.email
    };
  }

  @Put('users/:id/role')
  @Roles('admin')
  async updateUserRole(
    @Param('id') userId: number, 
    @Body() { role }: { role: string },
    @Request() req
  ) {
    const updatedUser = await this.authService.updateUserRole(userId, role);
    return {
      message: 'Rôle utilisateur mis à jour',
      user: updatedUser,
      updatedBy: req.user.email
    };
  }

  @Delete('users/:id')
  @Roles('admin')
  async deleteUser(@Param('id') userId: number, @Request() req) {
    await this.authService.deleteUser(userId);
    return {
      message: 'Utilisateur supprimé avec succès',
      deletedBy: req.user.email
    };
  }

  @Get('statistics')
  @Roles('admin')
  async getStatistics() {
    const users = await this.authService.getAllUsers();
    
    // Debug: voir tous les utilisateurs et leurs rôles
    console.log('=== DEBUG BACKEND STATISTICS ===');
    console.log('Nombre total d\'utilisateurs:', users.length);
    console.log('Utilisateurs et rôles:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Rôle: "${user.role}"`);
    });
    
    // Compter par rôle
    const doctors = users.filter(u => u.role === 'doctor');
    const patients = users.filter(u => u.role === 'patient');
    const receptionists = users.filter(u => u.role === 'receptionist');
    const admins = users.filter(u => u.role === 'admin');
    
    console.log('Doctors:', doctors.length, '- Patients:', patients.length, '- Receptionists:', receptionists.length, '- Admins:', admins.length);
    
    // Statistiques avancées
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const thisMonthUsers = users.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    });

    const lastMonthUsers = users.filter(user => {
      const userDate = new Date(user.createdAt);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return userDate.getMonth() === lastMonth && userDate.getFullYear() === lastMonthYear;
    });

    return {
      totalUsers: users.length,
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      totalReceptionists: receptionists.length,
      totalAdmins: admins.length,
      monthlyGrowth: {
        thisMonth: thisMonthUsers.length,
        lastMonth: lastMonthUsers.length,
        growth: thisMonthUsers.length - lastMonthUsers.length
      },
      specialties: users
        .filter(u => u.role === 'doctor' && u.specialty)
        .reduce((acc, doctor) => {
          acc[doctor.specialty] = (acc[doctor.specialty] || 0) + 1;
          return acc;
        }, {}),
      recentUsers: users
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt
        }))
    };
  }

  @Get('settings')
  @Roles('admin')
  async getSettings() {
    return {
      systemSettings: {
        applicationName: 'MedFlow',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        databaseStatus: 'Connectée',
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Simulation
        maintenanceMode: false
      },
      userSettings: {
        registrationOpen: true,
        emailVerificationRequired: false,
        defaultRole: 'patient',
        maxUsersPerRole: {
          doctors: 100,
          patients: 1000,
          receptionists: 20,
          admins: 5
        }
      },
      medicalSettings: {
        specialties: [
          'Cardiologie',
          'Dermatologie',
          'Endocrinologie',
          'Gastro-entérologie',
          'Gynécologie',
          'Neurologie',
          'Ophtalmologie',
          'Orthopédie',
          'Pédiatrie',
          'Psychiatrie',
          'Radiologie',
          'Urologie'
        ],
        departments: [
          'Accueil',
          'Urgences',
          'Hospitalisation',
          'Consultations',
          'Administration'
        ]
      }
    };
  }

  @Put('settings')
  @Roles('admin')
  async updateSettings(@Body() settings: any, @Request() req) {
    // Ici, vous pourriez sauvegarder les paramètres dans la base de données
    return {
      message: 'Paramètres mis à jour avec succès',
      settings,
      updatedBy: req.user.email,
      updatedAt: new Date()
    };
  }
}