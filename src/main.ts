import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];

  app.enableCors({
    origin: allowedOrigins,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  Object.keys(document.paths).forEach((path) => {
    Object.keys(document.paths[path]).forEach((method) => {
      const operation = (document.paths[path] as any)[method];
      if (operation) {
        operation.security = [{ bearer: [] }];
      }
    });
  });

  SwaggerModule.setup('api', app, document);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  await app.listen(port ?? 3000, '0.0.0.0');
}
bootstrap();
