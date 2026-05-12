# Requirements Document

## Introduction

UNIconnect is a full-stack application consisting of a Next.js frontend and a Node.js/Express/TypeScript backend (with Prisma + PGlite). This feature configures the application for deployment on the Kiro hosting platform using the experimental services model, where the frontend is served at the root route (`/`) and the backend API is proxied under `/_/backend`. The goal is to ensure both services start correctly, communicate with each other through the platform's routing layer, and expose all required environment variables in a deployment-ready state.

## Glossary

- **Deployment_Platform**: The Kiro hosting environment that routes traffic using the `experimentalServices` configuration.
- **Frontend**: The Next.js application located in the `/frontend` directory, served at route prefix `/`.
- **Backend**: The Node.js/Express API located in the `/backend` directory, served at route prefix `/_/backend`.
- **Route_Prefix**: The URL path segment under which a service is exposed by the Deployment_Platform (e.g., `/_/backend`).
- **API_URL**: The public URL the Frontend uses to reach the Backend API, resolved at runtime from the `NEXT_PUBLIC_API_URL` environment variable.
- **Socket_URL**: The public URL the Frontend uses to establish a WebSocket connection, resolved at runtime from the `NEXT_PUBLIC_SOCKET_URL` environment variable.
- **CORS_Origin**: The allowed origin the Backend accepts cross-origin requests from, configured via the `FRONTEND_URL` environment variable.
- **Kiro_Config**: The `.kiro.yml` or equivalent configuration file at the project root that declares the `experimentalServices` block.
- **Health_Endpoint**: The `/health` route on the Backend that returns a JSON status response.
- **Standalone_Output**: The Next.js `output: 'standalone'` build mode that produces a self-contained `server.js` for containerised or platform deployments.
- **PGlite**: The embedded WebAssembly PostgreSQL engine used by the Backend, requiring no external database service.

---

## Requirements

### Requirement 1: Kiro Deployment Configuration File

**User Story:** As a developer, I want a Kiro deployment configuration file at the project root, so that the Deployment_Platform knows how to route traffic to the Frontend and Backend services.

#### Acceptance Criteria

1. THE Kiro_Config SHALL declare the Frontend service with entrypoint `frontend`, route prefix `/`, and framework `nextjs`.
2. THE Kiro_Config SHALL declare the Backend service with entrypoint `backend` and route prefix `/_/backend`.
3. WHEN the Deployment_Platform reads the Kiro_Config, THE Deployment_Platform SHALL route all requests to `/` and its sub-paths to the Frontend.
4. WHEN the Deployment_Platform reads the Kiro_Config, THE Deployment_Platform SHALL route all requests to `/_/backend` and its sub-paths to the Backend.

---

### Requirement 2: Frontend Next.js Standalone Build

**User Story:** As a developer, I want the Next.js Frontend configured for standalone output, so that it can be started with a single `node server.js` command on the Deployment_Platform without requiring a full `node_modules` tree.

#### Acceptance Criteria

1. THE Frontend SHALL include `output: 'standalone'` in `next.config.ts`.
2. WHEN `npm run build` is executed in the `frontend` directory, THE Frontend SHALL produce a `.next/standalone/server.js` artifact.
3. THE Frontend Dockerfile SHALL copy `.next/standalone`, `.next/static`, and `public` into the runner image and start the server with `node server.js`.

---

### Requirement 3: Backend API Route Prefix Awareness

**User Story:** As a developer, I want the Backend to serve all API routes under a configurable base path, so that it functions correctly when the Deployment_Platform proxies requests from `/_/backend` to the Backend process.

#### Acceptance Criteria

1. THE Backend SHALL read an `API_BASE_PATH` environment variable to determine the route prefix (defaulting to `/` for local development).
2. WHEN `API_BASE_PATH` is set to `/_/backend`, THE Backend SHALL mount all Express routes relative to that prefix so that `/_/backend/api/auth` resolves correctly.
3. WHEN `API_BASE_PATH` is set to `/_/backend`, THE Backend Health_Endpoint SHALL be accessible at `/_/backend/health`.
4. IF `API_BASE_PATH` is not set, THEN THE Backend SHALL default to `/` and preserve existing local development behaviour.

---

### Requirement 4: Frontend API and Socket URL Configuration

**User Story:** As a developer, I want the Frontend to resolve the Backend API and WebSocket URLs from environment variables, so that it can reach the Backend through the Deployment_Platform's routing layer without hardcoded localhost addresses.

#### Acceptance Criteria

1. THE Frontend SHALL read `NEXT_PUBLIC_API_URL` to construct all HTTP API requests.
2. THE Frontend SHALL read `NEXT_PUBLIC_SOCKET_URL` to establish WebSocket connections.
3. WHEN deployed on the Deployment_Platform, `NEXT_PUBLIC_API_URL` SHALL be set to the platform-relative path `/_/backend/api` (or the full public URL if the platform requires absolute URLs).
4. WHEN deployed on the Deployment_Platform, `NEXT_PUBLIC_SOCKET_URL` SHALL be set to the platform-relative or absolute URL pointing to the Backend service.
5. IF `NEXT_PUBLIC_API_URL` is not set, THEN THE Frontend SHALL fall back to `http://localhost:5000/api` to preserve local development behaviour.
6. IF `NEXT_PUBLIC_SOCKET_URL` is not set, THEN THE Frontend SHALL fall back to `http://localhost:5000` to preserve local development behaviour.

---

### Requirement 5: Backend CORS Configuration for Deployment

**User Story:** As a developer, I want the Backend CORS policy to accept requests from the deployed Frontend origin, so that browser-enforced cross-origin restrictions do not block API calls in production.

#### Acceptance Criteria

1. THE Backend SHALL read the `FRONTEND_URL` environment variable to configure the CORS allowed origin.
2. WHEN `FRONTEND_URL` is set to the Deployment_Platform's public URL, THE Backend SHALL accept cross-origin requests from that origin.
3. IF `FRONTEND_URL` is not set, THEN THE Backend SHALL default to `http://localhost:3000` to preserve local development behaviour.
4. THE Backend SHALL reject cross-origin requests from origins not listed in the CORS allowed origin configuration.

---

### Requirement 6: Environment Variable Documentation for Deployment

**User Story:** As a developer, I want a deployment-specific environment variable reference, so that I can configure all required secrets and URLs correctly before deploying to the Deployment_Platform.

#### Acceptance Criteria

1. THE project root SHALL contain a `.env.example` file listing all environment variables required by both the Frontend and Backend.
2. THE `.env.example` SHALL include deployment-specific variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `FRONTEND_URL`, `API_BASE_PATH`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `OPENAI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`.
3. WHEN a developer copies `.env.example` to configure a deployment, THE `.env.example` SHALL include inline comments explaining the expected value for each variable in the Deployment_Platform context.

---

### Requirement 7: Backend Health Check Endpoint

**User Story:** As a developer, I want the Backend to expose a health check endpoint, so that the Deployment_Platform can verify the Backend service is running and ready to accept traffic.

#### Acceptance Criteria

1. THE Backend Health_Endpoint SHALL respond to `GET /health` (or `GET /_/backend/health` when `API_BASE_PATH` is set) with HTTP status `200`.
2. WHEN the Backend is fully initialised (PGlite database ready), THE Health_Endpoint SHALL return a JSON body containing `status: "ok"` and a current ISO 8601 timestamp.
3. WHEN the Backend is starting up and the database is not yet ready, THE Health_Endpoint SHALL return HTTP status `503` with a JSON body containing `status: "starting"`.
4. IF the PGlite database initialisation fails, THEN THE Backend SHALL return HTTP status `503` from the Health_Endpoint with a JSON body containing `status: "error"` and a descriptive `message` field.

---

### Requirement 8: Frontend Build-Time Environment Variable Injection

**User Story:** As a developer, I want `NEXT_PUBLIC_*` variables to be injected at build time, so that the compiled Frontend bundle contains the correct API URLs for the target deployment environment.

#### Acceptance Criteria

1. WHEN `npm run build` is executed in the `frontend` directory, THE Frontend SHALL embed the values of `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` present in the build environment into the compiled output.
2. THE Frontend Dockerfile SHALL accept `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` as Docker build arguments (`ARG`) and expose them as environment variables (`ENV`) before running `npm run build`.
3. WHEN the Docker build arguments are not provided, THE Frontend Dockerfile SHALL use `/_/backend/api` as the default value for `NEXT_PUBLIC_API_URL` and `/_/backend` as the default value for `NEXT_PUBLIC_SOCKET_URL`.
