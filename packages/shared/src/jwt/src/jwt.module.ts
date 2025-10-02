import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWT_CONSTANTS } from './jwt.constants';
import { JwtServiceCustom } from './jwt.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONSTANTS.ACCESS_SECRET,
      signOptions: { expiresIn: JWT_CONSTANTS.ACCESS_EXPIRATION_TIME },
    }),
  ],
  providers: [JwtServiceCustom],
  exports: [JwtServiceCustom, JwtModule],
})
export class JwtSharedModule {}
