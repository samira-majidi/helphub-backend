import 'reflect-metadata';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🚀 فعال‌سازی CORS برای ارتباط بدون مشکل با Next.js
  app.enableCors({
    origin: 'http://localhost:3000', // آدرس پیش‌فرض فرانت‌اند (اگه پورت Next.js رو عوض کردی، اینجا هم تغییرش بده)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // این گزینه برای ارسال کوکی‌ها و توکن‌های احراز هویت به شدت واجبه!
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //*
  // swagger configuration
  //*
  const config = new DocumentBuilder()
    .setDescription('Welcome this is my first API documentation') // یه کوچولو املای API رو درست کردم 😉
    .setTitle('Nest.JS /blog API')
    .setVersion('1.0')
    .setTermsOfService('terms of service')
    //.setLicense('MIT')
    .build();

  /////////
  // instantiate Document
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
