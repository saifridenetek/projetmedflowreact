import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  // Créer une nouvelle clinique (admin uniquement)
  @Post()
  @Roles('admin')
  async create(@Body() createClinicDto: CreateClinicDto) {
    const clinic = await this.clinicsService.create(createClinicDto);
    return {
      message: 'Clinique créée avec succès',
      clinic,
    };
  }

  // Obtenir toutes les cliniques (admin uniquement)
  @Get()
  @Roles('admin')
  async findAll() {
    const clinics = await this.clinicsService.findAll();
    return {
      message: 'Liste des cliniques',
      clinics,
      count: clinics.length,
    };
  }

  // Obtenir une clinique par ID (admin uniquement)
  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const clinic = await this.clinicsService.findOne(id);
    return {
      message: 'Détails de la clinique',
      clinic,
    };
  }

  // Mettre à jour une clinique (admin uniquement)
  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    const clinic = await this.clinicsService.update(id, updateClinicDto);
    return {
      message: 'Clinique mise à jour avec succès',
      clinic,
    };
  }

  // Supprimer une clinique (admin uniquement)
  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.clinicsService.remove(id);
    return {
      message: 'Clinique supprimée avec succès',
    };
  }

  // Affecter un utilisateur à une clinique (admin uniquement)
  @Post(':clinicId/assign-user/:userId')
  @Roles('admin')
  async assignUser(
    @Param('clinicId', ParseIntPipe) clinicId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const user = await this.clinicsService.assignUserToClinic(userId, clinicId);
    return {
      message: 'Utilisateur affecté à la clinique avec succès',
      user,
    };
  }

  // Désaffecter un utilisateur d'une clinique (admin uniquement)
  @Delete('unassign-user/:userId')
  @Roles('admin')
  async unassignUser(@Param('userId', ParseIntPipe) userId: number) {
    const user = await this.clinicsService.unassignUserFromClinic(userId);
    return {
      message: 'Utilisateur désaffecté de la clinique avec succès',
      user,
    };
  }

  // Obtenir les utilisateurs d'une clinique (admin uniquement)
  @Get(':id/users')
  @Roles('admin')
  async getUsers(@Param('id', ParseIntPipe) id: number) {
    const users = await this.clinicsService.getUsersByClinic(id);
    return {
      message: 'Liste des utilisateurs de la clinique',
      users,
      count: users.length,
    };
  }

  // Obtenir les statistiques d'une clinique (admin uniquement)
  @Get(':id/stats')
  @Roles('admin')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    const stats = await this.clinicsService.getClinicStats(id);
    return {
      message: 'Statistiques de la clinique',
      ...stats,
    };
  }
}
