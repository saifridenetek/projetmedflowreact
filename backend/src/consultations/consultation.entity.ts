import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../entities/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Consultation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Appointment, { eager: true })
  appointment: Appointment;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @ManyToOne(() => User, { eager: true })
  doctor: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string; // Isolation par clinique
}
