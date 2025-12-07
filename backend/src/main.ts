import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuration CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Ensure Stripe webhooks get the raw body required for signature verification
  // The payments webhook expects raw application/json payload
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  // Servir les fichiers uploadés (uploads/) sous le préfixe /uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Validation globale avec Zod
  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(3002);
  console.log('Backend démarré sur http://localhost:3002');
}
bootstrap();
