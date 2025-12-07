import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../entities/user.entity';

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  doctor: User;

  @ManyToOne(() => User, { eager: true })
  patient: User;

  @Column({ type: 'text' })
  medication: string;

  @Column({ type: 'text', nullable: true })
  dosage: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string; // Isolation par clinique
}
