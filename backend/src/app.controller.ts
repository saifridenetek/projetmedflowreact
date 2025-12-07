import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('hello')
export class AppController {
  @Get()
  getHello(): string {
    return '';
  }
}

