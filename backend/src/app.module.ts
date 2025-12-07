import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { User } from './entities/user.entity';
import { Clinic } from './entities/clinic.entity';
import { Appointment } from './appointments/appointment.entity';
import { Consultation } from './consultations/consultation.entity';
import { AppointmentsModule } from './appointments/appointments.module';
import { ProfileModule } from './profile/profile.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { ClinicsModule } from './clinics/clinics.module';
import { Payment } from './payments/payment.entity';
import { Prescription } from './prescriptions/prescription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
  entities: [User, Clinic, Appointment, Consultation, Prescription, Payment],
        synchronize: true, // À désactiver en production
      }),
      inject: [ConfigService],
    }),
  AuthModule,
  AdminModule,
  UserModule,
  ProfileModule,
  ConsultationsModule,
  PrescriptionsModule,
  AppointmentsModule,
  PaymentsModule,
  ClinicsModule
  
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
