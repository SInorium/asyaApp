import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { ArtworksModule } from './modules/artworks/artworks.module';
import { AuthModule } from './modules/auth/auth.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { StorageModule } from './modules/storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // .env ищем и в apps/api, и в корне монорепо
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    StorageModule,
    IntegrationsModule,
    AuthModule,
    ArtworksModule,
    InquiriesModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // ответы с @ZodResponse проходят через схему: лишние поля не утекают наружу
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
