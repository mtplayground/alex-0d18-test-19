import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { APP_NAME, type AppInfo } from "@myclawteam/shared";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8080;

function readPort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
}

const app = express();
const host = process.env.HOST || DEFAULT_HOST;
const port = readPort(process.env.PORT);

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
    environment: process.env.NODE_ENV || "development"
  });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ error: message });
};

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`${APP_NAME} API listening on http://${host}:${port}`);
});
