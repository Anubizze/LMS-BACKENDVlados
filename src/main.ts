import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
<<<<<<< HEAD
=======
import * as express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
>>>>>>> df9041c (LMS backend)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
<<<<<<< HEAD
    origin: process.env.FRONT_URL!,
=======
    origin: process.env.FRONT_URL ?? 'http://localhost:3000',
>>>>>>> df9041c (LMS backend)
    credentials: true,
  })

  app.use(cookieParser())

<<<<<<< HEAD
=======
  // Static uploads (локальные загруженные файлы)
  const uploadsRoot = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsRoot)) mkdirSync(uploadsRoot, { recursive: true });
  app.use('/uploads', express.static(uploadsRoot));

>>>>>>> df9041c (LMS backend)
  app.useGlobalPipes(
    new ValidationPipe(
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      }
    )
  )
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
