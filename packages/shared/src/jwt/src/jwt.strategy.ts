import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { TokenPayload } from "../../interfaces";

import { JWT_CONSTANTS } from "./jwt.constants";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONSTANTS.ACCESS_SECRET,
    });
  }

  async validate(payload: TokenPayload) {
    return { user_id: payload.user_id, verify: payload.verify };
  }
}
