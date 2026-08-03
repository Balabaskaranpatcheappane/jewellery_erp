import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({
    origin: config.get<string>('API_CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  const port = config.get<number>('API_PORT', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Jewelry ERP API listening on http://localhost:${port}/api`);
}

void bootstrap();
