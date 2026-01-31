# API Endpoints (Summary)

Base URL: `/api`

## Auth
- POST `/auth/login` {email, password} -> {accessToken, user} + refresh cookie
- POST `/auth/refresh` -> {accessToken}
- POST `/auth/logout` -> {ok:true}
- POST `/auth/forgot` (stub)
- POST `/auth/reset` (stub)

## Staff
- GET `/staff` (ADMIN) supports query params:
  - `q`, `area`, `post`, `gender`, `nationality`, `contractStatus`
- POST `/staff` (ADMIN)
- GET `/staff/:id` (ADMIN or owner STAFF)
- PATCH `/staff/:id` (ADMIN)
- PATCH `/staff/:id/self` (STAFF limited)
- GET `/staff/export/csv` (ADMIN)

## Users (ADMIN)
- GET `/users`
- POST `/users`
- PATCH `/users/:id`
- POST `/users/:id/reset-password`

## Documents
- POST `/docs/:staffId` create document metadata
- POST `/docs/:documentId/upload` multipart/form-data `file`
- GET `/docs/:documentId/signed-url` signed URL for current version
- POST `/docs/:documentId/verify` (ADMIN) {status: APPROVED|REJECTED}

## Audit (ADMIN)
- GET `/audit?staffId=&documentId=`

