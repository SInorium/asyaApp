import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { z } from 'zod';
import * as artworkDtos from './modules/artworks/artworks.dto';
import * as authDtos from './modules/auth/auth.dto';
import * as inquiryDtos from './modules/inquiries/inquiries.dto';

export const API_PREFIX = 'api';

/** Общая настройка для main.ts, экспорта OpenAPI и e2e-тестов. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.use(cookieParser());
  return app;
}

export function buildOpenApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Asya Art API')
    .setVersion('0.1.0')
    .addCookieAuth('access_token')
    .build();
  const doc = SwaggerModule.createDocument(app, config, {
    // MyArtworksController.list → myArtworksList → useMyArtworksList в orval
    operationIdFactory: (controller, method) => {
      const base = controller.replace(/Controller$/, '');
      return base[0]!.toLowerCase() + base.slice(1) + method[0]!.toUpperCase() + method.slice(1);
    },
  });
  return patchDtoSchemas(cleanupOpenApiDoc(doc));
}

type ZodDtoClass = { name: string; schema: z.ZodType };
const isZodDto = (v: unknown): v is ZodDtoClass =>
  typeof v === 'function' && 'schema' in v && v.schema instanceof z.ZodType;

/**
 * @nestjs/swagger разбирает свойства корневого DTO сам и превращает nullable-поля
 * (`type: ['string', 'null']`) в массивы строк. Перезаписываем такие схемы
 * результатом нативного z.toJSONSchema — он корректен.
 */
function patchDtoSchemas(doc: OpenAPIObject): OpenAPIObject {
  const schemas = doc.components?.schemas ?? {};
  const dtos = [artworkDtos, authDtos, inquiryDtos].flatMap((m) => Object.values(m)).filter(isZodDto);

  for (const dto of dtos) {
    for (const [key, io] of [
      [dto.name, 'input'],
      [`${dto.name}_Output`, 'output'],
    ] as const) {
      if (!schemas[key]) continue;
      const { $schema: _, ...json } = z.toJSONSchema(dto.schema, {
        target: 'openapi-3.0',
        io,
        unrepresentable: 'any',
      }) as Record<string, unknown>;
      schemas[key] = json;
    }
  }
  return doc;
}
