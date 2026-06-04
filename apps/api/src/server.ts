import type { Server } from "node:http";
import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { APP_NAME, type AppInfo } from "@myclawteam/shared";
import { loadConfig } from "./config/env.js";
import { createPrismaClient } from "./db/client.js";
import { isHttpError } from "./lib/httpError.js";
import { createUploadsRouter } from "./routes/uploads.js";
import { createObjectStorageClient } from "./storage/objectStorage.js";

const app = express();
const config = loadConfig();
const prisma = createPrismaClient(config);
const storage = createObjectStorageClient(config);

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

app.use("/api", createUploadsRouter({ prisma, storage }));

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (isHttpError(error)) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Unexpected server error" });
};

app.use(errorHandler);

function stopServer(server: Server) {
  server.close((closeError) => {
    prisma
      .$disconnect()
      .then(() => {
        if (closeError) {
          console.error(closeError);
          process.exit(1);
        }

        process.exit(0);
      })
      .catch((disconnectError: unknown) => {
        console.error(disconnectError);
        process.exit(1);
      });
  });
}

try {
  await prisma.$connect();

  const server = app.listen(config.port, config.host, () => {
    console.log(`${APP_NAME} API listening on http://${config.host}:${config.port}`);
  });

  process.on("SIGINT", () => {
    stopServer(server);
  });

  process.on("SIGTERM", () => {
    stopServer(server);
  });
} catch (error) {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
