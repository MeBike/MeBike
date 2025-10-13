import cors from "cors";
import { config } from "dotenv";
import express from "express";
import process from "node:process";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { defaultErrorHandler } from "./middlewares/error.middlewares";
import rentalsRouter from "./routes/rentals.routes";
import reportsRouter from "./routes/reports.routes";
import suppliersRouter from "./routes/suppliers.routes";
import usersRouter from "./routes/users.routes";
import databaseService from "./services/database.services";
import bikesRouter from "./routes/bikes.routes";

config();

import swaggerJSDoc from "swagger-jsdoc";

const port = process.env.PORT || 4000;

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MeBike API",
      version: "1.0.0",
    },
  },
  apis: ["./src/routes/*.ts", "./src/docs/openapi.yaml"],
};

const swaggerSpec = swaggerJSDoc(options);
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

databaseService.connect().then(async () => {
  databaseService.indexUsers();
  databaseService.indexBikes();
});

app.get("/", (req, res) => {
  res.send("Welcome to MeBike API");
});

app.use("/users", usersRouter);
app.use("/reports", reportsRouter);
app.use("/suppliers", suppliersRouter);
app.use("/bikes", bikesRouter);
app.use("/rentals", rentalsRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(defaultErrorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MeBike Backend đang chạy tại http://localhost:${port}`);
});
