import { PrismaClient } from "@prisma/client";
import type { AppConfig } from "../config/env.js";

export function createPrismaClient(config: Pick<AppConfig, "databaseUrl">): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl
      }
    }
  });
}
