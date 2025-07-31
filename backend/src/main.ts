import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DEFAULT_SERVER_PORT } from './common/constants/app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  const port = configService.get<number>('PORT') || DEFAULT_SERVER_PORT;
  await app.listen(port);
  logger.log(
    `🚀 GraphQL API com SQLite e Chat está rodando em: http://localhost:${port}/graphql`,
  );
  logger.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
