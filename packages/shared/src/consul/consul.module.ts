import { Module } from "@nestjs/common";

import { ConsulService } from "./consul.service";

@Module({
  providers: [ConsulService],
  exports: [ConsulService],
})
export class ConsulModule {}
