import { config } from "../config.js";
import { SupabaseStorage } from "./supabase.js";
import { LocalStorage } from "./local.js";

export type StoredFile = { fileKey: string };

export interface StorageDriver {
  putPrivate(params: { buffer: Buffer; fileKey: string; contentType: string }): Promise<StoredFile>;
  signedGetUrl(params: { fileKey: string; expiresInSec: number }): Promise<string>;
}

export const storage: StorageDriver =
  config.storageDriver === "supabase" ? new SupabaseStorage() : new LocalStorage();
