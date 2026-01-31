import fs from "fs/promises";
import path from "path";
import { StorageDriver } from "./index.js";
import { config } from "../config.js";

export class LocalStorage implements StorageDriver {
  async putPrivate({ buffer, fileKey }: { buffer: Buffer; fileKey: string; contentType: string }) {
    const full = path.join(config.localUploadDir, fileKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { fileKey };
  }

  async signedGetUrl({ fileKey }: { fileKey: string; expiresInSec: number }) {
    return `${config.publicBaseUrl}/files/${encodeURIComponent(fileKey)}`;
  }
}
