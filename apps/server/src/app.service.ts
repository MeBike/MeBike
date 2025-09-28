import type { User } from "@mebike/shared";

import { UserSchema } from "@mebike/shared";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }

  validateUser(userData: unknown): User {
    return UserSchema.parse(userData);
  }
}
