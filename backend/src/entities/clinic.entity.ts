import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tenantId: string; // Identifiant unique pour isoler les données de chaque clinique

  @Column()
  name: string; // Nom de la clinique

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.clinic)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
