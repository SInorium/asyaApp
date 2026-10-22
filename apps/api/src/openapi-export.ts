import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApi, configureApp } from './bootstrap';

/**
 * Пишет openapi.json без запуска сервера и подключения к БД
 * (onModuleInit вызывается только в app.init/listen).
 */
async function main() {
  const app = configureApp(await NestFactory.create(AppModule, { logger: ['error'] }));
  const out = resolve(__dirname, '../openapi.json');
  writeFileSync(out, JSON.stringify(buildOpenApi(app), null, 2));
  console.log(`OpenAPI → ${out}`);
  await app.close();
}

void main();
