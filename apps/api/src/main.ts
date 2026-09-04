import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true captures the untouched request body (as req.rawBody) alongside
  // the parsed JSON, so provider webhook signature verification can run on the
  // exact bytes received (see WebhooksController).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // The API runs behind a reverse proxy (Traefik, via Coolify), so without this
  // every request appears to come from the proxy's own address. Rate limiting
  // would then treat the entire user base as one client and lock everybody out
  // together. `1` trusts exactly one hop, so Express takes the address Traefik
  // set rather than anything a client put in X-Forwarded-For itself.
  app.set('trust proxy', 1);

  app.enableCors({
    origin: [
      'https://admin.lexiroot.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:8081',
      'http://localhost:19006',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
