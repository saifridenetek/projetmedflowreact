import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: any }> {
    const { 
      email, 
      firstName, 
      lastName, 
      password, 
      role,
      phone,
      specialty,
      licenseNumber,
      consultationFee,
      department,
      dateOfBirth,
      gender,
      address
    } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur avec les champs du système médical
    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role: role || 'patient',
      phone,
      specialty,
      licenseNumber,
      consultationFee,
      department,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address
    });

    await this.userRepository.save(user);

    // Préparer les données utilisateur (sans mot de passe)
    const { password: _, ...userData } = user;

    // Générer le token JWT
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: userData
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;

    // Trouver l'utilisateur
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Préparer les données utilisateur (sans mot de passe)
    const { password: _, ...userData } = user;

    // Générer le token JWT
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: userData
    };
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async getUsersByTenantId(tenantId: string): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { tenantId }
    });
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async getUsersForClinicStaff(tenantId: string): Promise<User[]> {
    // Retourne:
    // 1. Les médecins et réceptionnistes de la même clinique (même tenantId)
    // 2. TOUS les patients (peu importe leur tenantId)
    const staffUsers = await this.userRepository.find({
      where: { tenantId }
    });
    
    const patients = await this.userRepository.find({
      where: { role: 'patient' }
    });
    
    const allUsers = [...staffUsers, ...patients];
    
    return allUsers.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async findUserById(userId: number): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user;
  }

  async getUserProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async updateUser(userId: number, updateData: any): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Mettre à jour les champs autorisés
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    
    // Mettre à jour le rôle si fourni
    if (updateData.role) {
      const validRoles = ['admin', 'doctor', 'receptionist', 'patient'];
      if (!validRoles.includes(updateData.role)) {
        throw new Error('Rôle invalide');
      }
      user.role = updateData.role;
    }

    // Mettre à jour le mot de passe si fourni
    if (updateData.password && updateData.password.trim() !== '') {
      user.password = await bcrypt.hash(updateData.password, 10);
    }

    // Champs spécifiques au médecin
    if (user.role === 'doctor') {
      if (updateData.specialty !== undefined) user.specialty = updateData.specialty;
      if (updateData.licenseNumber !== undefined) user.licenseNumber = updateData.licenseNumber;
      if (updateData.consultationFee !== undefined) user.consultationFee = updateData.consultationFee;
    }

    // Champs spécifiques au réceptionniste
    if (user.role === 'receptionist') {
      if (updateData.department !== undefined) user.department = updateData.department;
    }

    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async updateUserRole(userId: number, role: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Vérifier que le rôle est valide
    const validRoles = ['admin', 'doctor', 'receptionist', 'patient'];
    if (!validRoles.includes(role)) {
      throw new Error('Rôle invalide');
    }

    user.role = role;
    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Empêcher la suppression du dernier admin
    if (user.role === 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new Error('Impossible de supprimer le dernier administrateur');
      }
    }

    await this.userRepository.remove(user);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const users = await this.userRepository.find({ where: { role } });
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }
}