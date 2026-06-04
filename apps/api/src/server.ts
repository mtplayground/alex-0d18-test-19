import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { APP_NAME, type AppInfo } from "@myclawteam/shared";
import { loadConfig } from "./config/env.js";

const app = express();
const config = loadConfig();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

app.get("/health", (_request: Request, response: Response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/api/info", (_request: Request, response: Response<AppInfo>) => {
  response.status(200).json({
    name: APP_NAME,
    version: "0.1.0",
    environment: config.nodeEnv
  });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ error: message });
};

app.use(errorHandler);

app.listen(config.port, config.host, () => {
  console.log(`${APP_NAME} API listening on http://${config.host}:${config.port}`);
});
