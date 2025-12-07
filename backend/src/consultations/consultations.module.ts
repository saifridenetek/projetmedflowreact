import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultation.entity';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation, Appointment, User])],
  providers: [ConsultationsService],
  controllers: [ConsultationsController],
  exports: [ConsultationsService]
})
export class ConsultationsModule {}
