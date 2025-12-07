import { Controller, Post, UseGuards, UploadedFile, UseInterceptors, Request, Put, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

function filenameGenerator(req, file, cb) {
  const ext = path.extname(file.originalname);
  const name = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  cb(null, name);
}

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: filenameGenerator,
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfilePhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.profileService.uploadPhoto(req.user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(@Request() req, @Body() body: any) {
    return this.profileService.updateProfile(req.user.id, body);
  }
}
