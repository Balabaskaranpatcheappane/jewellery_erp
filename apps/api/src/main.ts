import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  // Validation is handled per-route with ZodValidationPipe (see common/), so we
  // deliberately don't register Nest's class-validator ValidationPipe here.
  app.enableCors({
    origin: config
      .get<string>(
        'API_CORS_ORIGIN',
        'http://localhost:5173,http://localhost:4180',
      )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });

  const port = config.get<number>('API_PORT', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Jewelry ERP API listening on http://localhost:${port}/api`);
}

void bootstrap();
