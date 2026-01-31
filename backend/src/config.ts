export const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  tz: process.env.APP_TIMEZONE || "Asia/Riyadh",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
  accessTtlMin: Number(process.env.ACCESS_TOKEN_TTL_MIN || 15),
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  storageDriver: process.env.STORAGE_DRIVER || "local",
  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "icu-docs"
  },
  localUploadDir: process.env.LOCAL_UPLOAD_DIR || "./uploads",
  maxFileMB: Number(process.env.MAX_FILE_MB || 20),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${Number(process.env.PORT || 4000)}`
};
