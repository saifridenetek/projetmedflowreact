import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuration CORS
  // Accepter le frontend depuis la variable d'environnement ou localhost en développement
  const allowedOrigins: (string | RegExp)[] = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173', // Toujours autoriser localhost pour le dev
  ];
  
  // Ajouter toutes les URL Vercel (production + preview)
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('vercel.app')) {
    allowedOrigins.push(/https:\/\/.*\.vercel\.app$/);
  }
  
  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (comme Postman, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Vérifier si l'origin est dans la liste autorisée
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
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
