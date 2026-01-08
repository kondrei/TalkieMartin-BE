import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MemoryModule } from './memories/memory.module';
import { S3Module } from './s3/s3.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    HealthModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
        dbName: config.get('DB_NAME'),
      }),
      inject: [ConfigService],
    }),
    MemoryModule,
    S3Module,
    UserModule,
    JwtModule,
    CacheModule.register({ isGlobal: true }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
})
export class AppModule {}
