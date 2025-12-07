import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './prescription.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private prescriptionRepository: Repository<Prescription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: any): Promise<Prescription> {
    try {
      const doctor = await this.userRepository.findOne({ where: { id: data.doctorId } });
      const patient = await this.userRepository.findOne({ where: { id: data.patientId } });
      if (!doctor || !patient) throw new Error('Doctor or patient not found');

      const p = new Prescription();
      p.doctor = doctor;
      p.patient = patient;
      p.medication = data.medication;
      p.dosage = data.dosage;
      p.notes = data.notes;

      return await this.prescriptionRepository.save(p);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Could not create prescription');
    }
  }

  async findByPatient(patientId: number): Promise<Prescription[]> {
    return this.prescriptionRepository.find({ where: { patient: { id: patientId } }, order: { createdAt: 'DESC' } });
  }

  async findByDoctor(doctorId: number): Promise<Prescription[]> {
    return this.prescriptionRepository.find({ where: { doctor: { id: doctorId } }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Prescription | null> {
    return this.prescriptionRepository.findOne({ where: { id } });
  }
}
