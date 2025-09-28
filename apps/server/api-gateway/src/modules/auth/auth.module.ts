import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthService } from './auth.service';
import {
  ConsulModule,
  ConsulService,
  CONSULT_SERVICE_ID,
  GRPC_PACKAGE,
} from '@mebike/shared';
import { AuthResolver } from './auth.resolver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConsulModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: GRPC_PACKAGE.AUTH,
        imports: [ConsulModule],
        inject: [ConsulService],
        useFactory: async (consulService: ConsulService) => {
          const authService = await consulService.discoverService(
            CONSULT_SERVICE_ID.AUTH,
          );
          return {
            transport: Transport.GRPC,
            options: {
              package: 'auth',
              protoPath: join(process.cwd(), 'common/src/lib/proto/auth.proto'),
              url: `${authService.address}:${authService.port}`,
            },
          };
        },
      },
    ]),
  ],
  providers: [AuthService, AuthResolver],
})
export class AuthModule {}
