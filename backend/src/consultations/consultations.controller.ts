import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ConsultationsService } from './consultations.service';

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  @Get('doctor')
  @Roles('doctor','admin')
  async findByDoctor(@Request() req) {
    return this.consultationsService.findByDoctor(req.user.id);
  }

  @Get('patient')
  @Roles('patient','doctor','admin')
  async findByPatient(@Request() req) {
    return this.consultationsService.findByPatient(req.user.id);
  }

  // For admin/receptionist/doctor: get consultations for a specific patient
  @Get('patient/:id')
  @Roles('admin','receptionist','doctor')
  async findByPatientId(@Param('id') id: number) {
    return this.consultationsService.findByPatient(Number(id));
  }

  @Post()
  @Roles('doctor')
  async create(@Body() body: any, @Request() req) {
    // body expected: { appointmentId, patientId, diagnosis, notes }
    const data = {
      appointmentId: body.appointmentId,
      patientId: body.patientId,
      doctorId: req.user.id,
      diagnosis: body.diagnosis,
      notes: body.notes
    };
    return this.consultationsService.create(data);
  }
}
