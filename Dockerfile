# ==========================================
# Stage 1: Build the React static frontend
# ==========================================
FROM node:20-alpine AS web-builder

WORKDIR /app

# Install pnpm globally matching version 9.15.0
RUN npm install -g pnpm@9.15.0

# Copy workspace meta files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy packages and frontend web code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install pnpm dependencies for packages and web app
RUN pnpm install --frozen-lockfile --filter "@trivia/web..."

# Build packages and the static React web bundle
RUN pnpm --filter "@trivia/web..." run build


# ==========================================
# Stage 2: Build API and run combined server
# ==========================================
FROM mcr.microsoft.com/playwright:v1.42.1-jammy AS api-runner

WORKDIR /app

# Install pnpm globally matching version 9.15.0
RUN npm install -g pnpm@9.15.0

# Copy workspace meta files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy packages and backend API code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install pnpm dependencies for packages and api server
RUN pnpm install --frozen-lockfile --filter "@trivia/api..."

# Build packages and Hono API server
RUN pnpm --filter "@trivia/api..." run build

# Copy the pre-built static web assets into Hono's distribution path
COPY --from=web-builder /app/apps/web/dist ./apps/api/dist/web

# Expose production port (Railway dynamically overrides this via PORT env)
EXPOSE 3001

# Run migrations, run conditional seeding, and start Hono's combined server
CMD pnpm --filter @trivia/db db:migrate && pnpm --filter @trivia/db db:seed && pnpm --filter @trivia/api run start
