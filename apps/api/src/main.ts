import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX, buildOpenApi, configureApp } from './bootstrap';

async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // за Caddy: реальный IP клиента берём из X-Forwarded-For (нужно для throttler)
  app.set('trust proxy', 1);
  configureApp(app);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, buildOpenApi(app));
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`API: http://localhost:${port}/${API_PREFIX}, docs: /${API_PREFIX}/docs`);
}

void main();
