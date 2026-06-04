import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
  type PutObjectCommandInput
} from "@aws-sdk/client-s3";
import type { AppConfig } from "../config/env.js";

export interface PutStoredObjectInput {
  key: string;
  body: NonNullable<PutObjectCommandInput["Body"]>;
  contentType: string;
  contentLength?: number;
}

export interface StoredObjectReference {
  bucket: string;
  key: string;
  fullKey: string;
}

export interface RetrievedStoredObject extends StoredObjectReference {
  body: NonNullable<GetObjectCommandOutput["Body"]>;
  contentType: string;
  contentLength?: number;
}

export class ObjectStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ObjectStorageError";
  }
}

export class ObjectStorageClient {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(config: AppConfig["objectStorage"]) {
    this.bucket = config.bucket;
    this.prefix = config.prefix;
    this.s3 = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  async putObject(input: PutStoredObjectInput): Promise<StoredObjectReference> {
    const fullKey = this.fullKey(input.key);
    const commandInput: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: fullKey,
      Body: input.body,
      ContentType: input.contentType
    };

    if (input.contentLength !== undefined) {
      commandInput.ContentLength = input.contentLength;
    }

    try {
      await this.s3.send(new PutObjectCommand(commandInput));
    } catch (error) {
      throw new ObjectStorageError(`Failed to put object: ${input.key}`, { cause: error });
    }

    return {
      bucket: this.bucket,
      key: input.key,
      fullKey
    };
  }

  async getObject(key: string): Promise<RetrievedStoredObject> {
    const fullKey = this.fullKey(key);

    let output: GetObjectCommandOutput;
    try {
      output = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: fullKey
        })
      );
    } catch (error) {
      throw new ObjectStorageError(`Failed to get object: ${key}`, { cause: error });
    }

    if (!output.Body) {
      throw new ObjectStorageError(`Object response did not include a body: ${key}`);
    }

    const retrievedObject: RetrievedStoredObject = {
      bucket: this.bucket,
      key,
      fullKey,
      body: output.Body,
      contentType: output.ContentType || "application/octet-stream"
    };

    if (output.ContentLength !== undefined) {
      retrievedObject.contentLength = output.ContentLength;
    }

    return retrievedObject;
  }

  fullKey(key: string): string {
    const relativeKey = this.validateRelativeKey(key);
    return this.prefix + relativeKey;
  }

  private validateRelativeKey(key: string): string {
    if (!key) {
      throw new ObjectStorageError("Object key is required");
    }

    if (key.startsWith("/")) {
      throw new ObjectStorageError("Object key must be relative and must not start with a slash");
    }

    if (key.startsWith(this.prefix)) {
      throw new ObjectStorageError("Object key must not include the configured storage prefix");
    }

    if (key.includes("\0")) {
      throw new ObjectStorageError("Object key must not contain null bytes");
    }

    return key;
  }
}

export function createObjectStorageClient(config: AppConfig): ObjectStorageClient {
  return new ObjectStorageClient(config.objectStorage);
}
