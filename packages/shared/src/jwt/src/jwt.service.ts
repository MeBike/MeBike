import type { JwtService } from "@nestjs/jwt";

import { Injectable } from "@nestjs/common";

import type { TokenPayload } from "../../interfaces";

@Injectable()
export class JwtServiceCustom {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(payload: TokenPayload, options?: any) {
    return this.jwtService.sign(payload, options);
  }

  async decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  async verifyToken(token: string, options?: any) {
    return this.jwtService.verify(token, options);
  }
}
