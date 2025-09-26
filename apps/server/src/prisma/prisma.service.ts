import type { OnModuleInit } from "@nestjs/common";

import { Injectable } from "@nestjs/common";

import { PrismaClient } from "../generated/prisma";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
