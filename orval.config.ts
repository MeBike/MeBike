import { defineConfig } from "orval";

export default defineConfig({
  iotService: {
    input: "openapi/iot-service.json",
    output: {
      target: "packages/shared/src/clients/iot-service/client.ts",
      schemas: "packages/shared/src/clients/iot-service/schemas",
      mode: "split",
      client: "fetch",
    },
  },
});
