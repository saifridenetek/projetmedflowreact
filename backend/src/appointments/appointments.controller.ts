import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles('admin','receptionist')
  async findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('doctor/:id')
  @Roles('admin','receptionist','doctor')
  async findByDoctor(@Param('id') id: number) {
    return this.appointmentsService.findByDoctor(Number(id));
  }

  @Get('me')
  @Roles('doctor')
  async findMine(@Request() req) {
    return this.appointmentsService.findByDoctor(req.user.id);
  }

  @Post()
  @Roles('admin','receptionist')
  async create(@Body() body: any, @Request() req) {
    const appt = await this.appointmentsService.create(body);
    return appt;
  }

  @Delete(':id')
  @Roles('admin','receptionist')
  async remove(@Param('id') id: number) {
    return this.appointmentsService.delete(id);
  }

  @Put(':id')
  @Roles('admin','receptionist','doctor')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.appointmentsService.update(Number(id), body);
  }

  // Allow doctors (and staff) to update appointment status (accept/refuse)
  @Put(':id/status')
  @Roles('admin','receptionist','doctor')
  async updateStatus(@Param('id') id: number, @Body() body: any) {
    const { status } = body;
    return this.appointmentsService.updateStatus(Number(id), status);
  }
}
