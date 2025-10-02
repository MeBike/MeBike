import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GrpcExceptionFilter } from '@mebike/shared';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
async function bootstrap() {
  dotenvConfig();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['auth'],
        protoPath: [
          join(__dirname, '../../../common/src/lib/proto/auth.proto'),
        ],
        url: `0.0.0.0:${process.env.AUTH_SERVICE_PORT}`,
      },
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GrpcExceptionFilter());
  await app.listen();
}
bootstrap();
