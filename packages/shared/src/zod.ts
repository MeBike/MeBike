import { extendZodWithOpenApi } from "@hono/zod-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export { z };
