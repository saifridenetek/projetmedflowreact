import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './prescription.entity';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, User])],
  providers: [PrescriptionsService],
  controllers: [PrescriptionsController],
  exports: [PrescriptionsService]
})
export class PrescriptionsModule {}
