# Use Microsoft's official Playwright jammy node image
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Set working directory
WORKDIR /app

# Install pnpm globally matching version 9.15.0
RUN npm install -g pnpm@9.15.0

# Copy workspace meta files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy packages and Hono api code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install pnpm workspace dependencies for API and its packages
RUN pnpm install --frozen-lockfile --filter "@trivia/api..."

# Build packages and compile API TypeScript
RUN pnpm --filter "@trivia/api..." run build

# Expose production port (Railway dynamically overrides this via PORT env)
EXPOSE 3001

# Start the Node.js API server
CMD ["pnpm", "--filter", "@trivia/api", "run", "start"]
