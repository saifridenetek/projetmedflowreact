import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'doctor', 'receptionist', 'patient']).default('patient'),
  phone: z.string().optional(),
  // Champs spécifiques aux médecins
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  consultationFee: z.number().optional(),
  department: z.string().optional(),
  // Champs spécifiques aux patients
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => {
  // Si c'est un médecin, certains champs sont obligatoires
  if (data.role === 'doctor') {
    return data.specialty && data.licenseNumber && data.consultationFee;
  }
  return true;
}, {
  message: "Spécialité, numéro de licence et tarif sont obligatoires pour les médecins",
  path: ["specialty"],
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export class LoginDto extends createZodDto(LoginSchema) {}