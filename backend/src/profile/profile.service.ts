import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async uploadPhoto(userId: number, file: Express.Multer.File) {
    try {
      if (!file) throw new InternalServerErrorException('No file provided');

      // Ensure uploads/profiles exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = file.filename || file.originalname;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new InternalServerErrorException('Utilisateur introuvable');

      user['photo'] = filename;
      await this.userRepository.save(user);

      return { message: 'Photo uploadée', filename };
    } catch (error) {
      throw new InternalServerErrorException(error?.message || 'Upload error');
    }
  }

  async updateProfile(userId: number, data: any) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new InternalServerErrorException('Utilisateur introuvable');

      // Allow only certain fields to be updated
      const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address', 'email'];
      for (const key of Object.keys(data)) {
        if (allowed.includes(key) && typeof data[key] !== 'undefined') {
          // If dateOfBirth is provided as string, convert to Date
          if (key === 'dateOfBirth' && data[key]) {
            user.dateOfBirth = new Date(data[key]);
          } else {
            user[key] = data[key];
          }
        }
      }

      await this.userRepository.save(user);

      // Return user without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user as any;
      return result;
    } catch (error) {
      throw new InternalServerErrorException(error?.message || 'Update error');
    }
  }
}
