import cors from "cors";
import { config } from "dotenv";
import express from "express";
import process from "node:process";
import databaseService from "./services/database.services";
import usersRouter from "./routes/users.routes";

config();

const port = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

databaseService.connect().then(async () => {
  databaseService.indexUsers();
});

app.get("/", (req, res) => {
  res.send("Welcome to MeBike API");
});

app.use('/users', usersRouter)

app.listen(port, () => {
  console.log(`MeBike Backend đang chạy tại http://localhost:${port}`);
});
