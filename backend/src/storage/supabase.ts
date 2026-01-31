import { StorageDriver } from "./index.js";
import { config } from "../config.js";
import { createClient } from "@supabase/supabase-js";

export class SupabaseStorage implements StorageDriver {
  private client = createClient(config.supabase.url, config.supabase.serviceRoleKey);

  async putPrivate({ buffer, fileKey, contentType }: { buffer: Buffer; fileKey: string; contentType: string }) {
    const { error } = await this.client.storage.from(config.supabase.bucket).upload(fileKey, buffer, {
      contentType,
      upsert: true
    });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return { fileKey };
  }

  async signedGetUrl({ fileKey, expiresInSec }: { fileKey: string; expiresInSec: number }) {
    const { data, error } = await this.client.storage.from(config.supabase.bucket).createSignedUrl(fileKey, expiresInSec);
    if (error || !data?.signedUrl) throw new Error(`Signed URL failed: ${error?.message}`);
    return data.signedUrl;
  }
}
