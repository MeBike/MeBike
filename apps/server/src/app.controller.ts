import { Controller, Get } from "@nestjs/common";

import type { AppService } from "./app.service.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("validate-user")
  validateUser() {
    const userData = {
      id: 1,
      email: "test@example.com",
      name: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.appService.validateUser(userData);
  }
}
