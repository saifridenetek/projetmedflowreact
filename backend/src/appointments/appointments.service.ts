import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({ order: { appointment_datetime: 'ASC' } });
  }

  async findByDoctor(doctorId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { doctor: { id: doctorId } as any },
      order: { appointment_datetime: 'ASC' }
    });
  }

  async create(data: any): Promise<Appointment> {
    try {
      const patient = await this.userRepository.findOne({ where: { id: data.patient_id } });
      const doctor = await this.userRepository.findOne({ where: { id: data.doctor_id } });
      if (!patient || !doctor) throw new Error('Patient or doctor not found');

      const appointment = this.appointmentRepository.create({
        patient,
        doctor,
        appointment_datetime: new Date(data.appointment_datetime),
        reason: data.reason,
        notes: data.notes,
        status: data.status || 'pending'
      });

      return await this.appointmentRepository.save(appointment);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Could not create appointment');
    }
  }

  async delete(id: number) {
    await this.appointmentRepository.delete(id);
  }

  async update(id: number, data: any) {
    const appt = await this.appointmentRepository.findOne({ where: { id } });
    if (!appt) throw new Error('Appointment not found');
    if (data.appointment_datetime) appt.appointment_datetime = new Date(data.appointment_datetime);
    if (data.reason) appt.reason = data.reason;
    if (data.notes) appt.notes = data.notes;
    if (data.status) appt.status = data.status;
    return this.appointmentRepository.save(appt);
  }

  async updateStatus(id: number, status: string) {
    const appt = await this.appointmentRepository.findOne({ where: { id } });
    if (!appt) throw new Error('Appointment not found');
    appt.status = status;
    const saved = await this.appointmentRepository.save(appt);

    // emit notification so clients can update
    try {
      this.notificationsService.emit({
        type: 'appointment_status_updated',
        appointmentId: saved.id,
        status: saved.status,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not emit appointment_status_updated notification', err?.message || err);
    }

    return saved;
  }
}
