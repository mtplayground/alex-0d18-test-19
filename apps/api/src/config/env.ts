const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8080;

export interface AppConfig {
  host: string;
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  objectStorage: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    prefix: string;
    endpoint: string;
    region: string;
    forcePathStyle: boolean;
  };
}

function readRequired(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptional(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

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

function readBoolean(name: string): boolean {
  const value = readRequired(name).toLowerCase();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`Invalid ${name} value: expected "true" or "false"`);
}

function readPostgresUrl(): string {
  const value = readRequired("DATABASE_URL");

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid DATABASE_URL value: expected a PostgreSQL connection URL");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("Invalid DATABASE_URL value: protocol must be postgres:// or postgresql://");
  }

  return value;
}

function readEndpoint(): string {
  const value = readRequired("OBJECT_STORAGE_ENDPOINT");

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error("Invalid OBJECT_STORAGE_ENDPOINT value: expected an HTTP(S) URL");
  }

  return value;
}

function readObjectPrefix(): string {
  const value = readRequired("OBJECT_STORAGE_PREFIX");

  if (!value.endsWith("/")) {
    throw new Error("Invalid OBJECT_STORAGE_PREFIX value: expected a trailing slash");
  }

  return value;
}

export function loadConfig(): AppConfig {
  return {
    host: readOptional("HOST", DEFAULT_HOST),
    port: readPort(process.env.PORT),
    nodeEnv: readOptional("NODE_ENV", "development"),
    databaseUrl: readPostgresUrl(),
    objectStorage: {
      accessKeyId: readRequired("OBJECT_STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: readRequired("OBJECT_STORAGE_SECRET_ACCESS_KEY"),
      bucket: readRequired("OBJECT_STORAGE_BUCKET"),
      prefix: readObjectPrefix(),
      endpoint: readEndpoint(),
      region: readRequired("OBJECT_STORAGE_REGION"),
      forcePathStyle: readBoolean("OBJECT_STORAGE_FORCE_PATH_STYLE")
    }
  };
}
