import { Module } from '@nestjs/common';
import { AuthGrpcController } from './auth.grpc.controller';
import { JwtSharedModule } from '@mebike/shared';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtSharedModule],
  controllers: [AuthGrpcController],
  providers: [AuthService],
})
export class AuthModule {}
