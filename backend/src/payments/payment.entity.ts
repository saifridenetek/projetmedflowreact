import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Appointment, { eager: true })
  appointment: Appointment;

  @Column()
  amount: number;

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'succeeded' | 'failed'

  @Column({ nullable: true })
  stripeSessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string; // Isolation par clinique
}
