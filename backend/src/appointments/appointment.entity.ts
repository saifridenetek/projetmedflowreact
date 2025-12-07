import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../entities/user.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @ManyToOne(() => User, { eager: true })
  doctor: User;

  @Column({ type: 'timestamp' })
  appointment_datetime: Date;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'accepted' | 'refused'

  @Column({ default: false })
  paid: boolean;

  @Column({ nullable: true })
  tenantId: string; // Isolation par clinique
}
