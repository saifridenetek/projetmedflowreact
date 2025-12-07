import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Consultation[]> {
    return this.consultationRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByDoctor(doctorId: number): Promise<Consultation[]> {
    return this.consultationRepository.find({ where: { doctor: { id: doctorId } }, order: { createdAt: 'DESC' } });
  }

  async findByPatient(patientId: number): Promise<Consultation[]> {
    return this.consultationRepository.find({ where: { patient: { id: patientId } }, order: { createdAt: 'DESC' } });
  }

  async create(data: any): Promise<Consultation> {
    try {
      const appointment = await this.appointmentRepository.findOne({ where: { id: data.appointmentId } });
      const doctor = await this.userRepository.findOne({ where: { id: data.doctorId } });
      const patient = await this.userRepository.findOne({ where: { id: data.patientId } });

      if (!doctor || !patient) throw new Error('Doctor or patient not found');

      const consultation = new Consultation();
  if (appointment) consultation.appointment = appointment;
      consultation.doctor = doctor;
      consultation.patient = patient;
      consultation.notes = data.notes;
      consultation.diagnosis = data.diagnosis;

      return await this.consultationRepository.save(consultation);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Could not create consultation');
    }
  }
}
