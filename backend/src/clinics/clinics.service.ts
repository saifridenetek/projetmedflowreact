import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../entities/clinic.entity';
import { User } from '../entities/user.entity';
import { CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Créer une nouvelle clinique
  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    // Générer un tenantId unique
    const tenantId = `clinic_${uuidv4()}`;

    const clinic = this.clinicRepository.create({
      ...createClinicDto,
      tenantId,
    });

    return await this.clinicRepository.save(clinic);
  }

  // Obtenir toutes les cliniques
  async findAll(): Promise<Clinic[]> {
    return await this.clinicRepository.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  // Obtenir une clinique par ID
  async findOne(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!clinic) {
      throw new NotFoundException(`Clinique avec l'ID ${id} non trouvée`);
    }

    return clinic;
  }

  // Obtenir une clinique par tenantId
  async findByTenantId(tenantId: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { tenantId },
      relations: ['users'],
    });

    if (!clinic) {
      throw new NotFoundException(`Clinique avec tenantId ${tenantId} non trouvée`);
    }

    return clinic;
  }

  // Mettre à jour une clinique
  async update(id: number, updateClinicDto: UpdateClinicDto): Promise<Clinic> {
    const clinic = await this.findOne(id);

    Object.assign(clinic, updateClinicDto);

    return await this.clinicRepository.save(clinic);
  }

  // Supprimer une clinique
  async remove(id: number): Promise<void> {
    const clinic = await this.findOne(id);

    // Vérifier si la clinique a des utilisateurs
    if (clinic.users && clinic.users.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer une clinique avec des utilisateurs. Veuillez d\'abord désaffecter les utilisateurs.',
      );
    }

    await this.clinicRepository.remove(clinic);
  }

  // Affecter un utilisateur à une clinique
  async assignUserToClinic(userId: number, clinicId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    const clinic = await this.findOne(clinicId);

    user.clinic = clinic;
    user.clinicId = clinicId;
    user.tenantId = clinic.tenantId;

    return await this.userRepository.save(user);
  }

  // Désaffecter un utilisateur d'une clinique
  async unassignUserFromClinic(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    // Utiliser une requête SQL raw pour mettre à jour les champs nullable à NULL
    await this.userRepository.query(
      'UPDATE users SET "clinicId" = NULL, "tenantId" = NULL WHERE id = $1',
      [userId],
    );

    const updatedUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!updatedUser) {
      throw new NotFoundException(`Impossible de récupérer l'utilisateur après mise à jour`);
    }

    return updatedUser;
  }

  // Obtenir les utilisateurs d'une clinique
  async getUsersByClinic(clinicId: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { clinicId },
      order: { createdAt: 'DESC' },
    });
  }

  // Obtenir les statistiques d'une clinique
  async getClinicStats(clinicId: number) {
    const clinic = await this.findOne(clinicId);
    const users = await this.getUsersByClinic(clinicId);

    const stats = {
      totalUsers: users.length,
      doctors: users.filter((u) => u.role === 'doctor').length,
      receptionists: users.filter((u) => u.role === 'receptionist').length,
      patients: users.filter((u) => u.role === 'patient').length,
      activeUsers: users.filter((u) => u.isActive).length,
    };

    return {
      clinic,
      stats,
    };
  }
}
