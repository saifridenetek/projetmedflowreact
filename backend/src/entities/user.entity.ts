import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  tenantId: string; // Identifiant de la clinique pour isolation des données

  @ManyToOne(() => Clinic, (clinic) => clinic.users, { nullable: true })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @Column({ nullable: true })
  clinicId: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  password: string;

  @Column({ default: 'patient' })
  role: string; // 'admin' | 'doctor' | 'receptionist' | 'patient'

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  specialty: string; // Pour les médecins

  @Column({ nullable: true })
  licenseNumber: string; // Pour les médecins

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consultationFee: number; // Pour les médecins

  @Column({ nullable: true })
  department: string; // Pour médecins et réceptionnistes

  @Column({ nullable: true })
  dateOfBirth: Date; // Pour les patients

  @Column({ nullable: true })
  gender: string; // 'male' | 'female' | 'other'

  @Column({ nullable: true })
  address: string; // Pour les patients

  @Column({ nullable: true })
  photo: string; // Nom de fichier ou URL de la photo de profil

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}