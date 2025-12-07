import { Controller, Get, Post, Body, UseGuards, Request, Param, Res, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrescriptionsService } from './prescriptions.service';
import type { Response } from 'express';

const PDFDocument = require('pdfkit');

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles('doctor')
  async create(@Body() body: any, @Request() req) {
    // body expected: { patientId, medication, dosage, notes }
    const data = {
      doctorId: req.user.id,
      patientId: body.patientId,
      medication: body.medication,
      dosage: body.dosage,
      notes: body.notes,
    };
    return this.prescriptionsService.create(data);
  }

  @Get('patient')
  @Roles('patient','doctor','admin')
  async findByPatient(@Request() req) {
    return this.prescriptionsService.findByPatient(req.user.id);
  }

  // For admin/receptionist/doctor: get prescriptions for a specific patient
  @Get('patient/:id')
  @Roles('admin','receptionist','doctor')
  async findByPatientId(@Param('id') id: number) {
    return this.prescriptionsService.findByPatient(Number(id));
  }

  @Get('doctor')
  @Roles('doctor','admin')
  async findByDoctor(@Request() req) {
    return this.prescriptionsService.findByDoctor(req.user.id);
  }

  @Get(':id/pdf')
  @Roles('patient','doctor','admin')
  async pdf(@Param('id') id: number, @Request() req, @Res() res: Response) {
    const prescription = await this.prescriptionsService.findOne(Number(id));
    if (!prescription) throw new NotFoundException('Prescription not found');

    // Authorization: allow patient owner, doctor who created it, or admin
    const uid = req.user.id;
    if (prescription.patient.id !== uid && prescription.doctor.id !== uid && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Generate simple PDF using pdfkit
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ordonnance-${prescription.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('Ordonnance', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Médecin: ${prescription.doctor.firstName} ${prescription.doctor.lastName}`);
    doc.text(`Patient: ${prescription.patient.firstName} ${prescription.patient.lastName}`);
    doc.text(`Date: ${prescription.createdAt.toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Médicament(s):');
    doc.fontSize(12).text(prescription.medication || '-');
    if (prescription.dosage) {
      doc.moveDown();
      doc.fontSize(12).text(`Posologie: ${prescription.dosage}`);
    }
    if (prescription.notes) {
      doc.moveDown();
      doc.fontSize(12).text(`Notes: ${prescription.notes}`);
    }

    doc.moveDown(2);
    doc.fontSize(10).text('Signature:', { align: 'left' });
    doc.end();
  }
}
