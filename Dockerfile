# Dockerfile — Fallback for container-based PaaS (Render, Railway)
# The primary deployment is Vercel Serverless (see vercel.json).
# This Dockerfile is kept for environments that require a persistent container.
FROM node:22-bookworm-slim

# Set up working directories
WORKDIR /app

# Copy only server files (.dockerignore excludes client/, .git, etc.)
COPY server/ /app/server/

# Install server dependencies with deterministic lockfile
WORKDIR /app/server
RUN npm ci --omit=dev

# Generate Prisma client at build time (does not require DB connection)
RUN npx prisma generate

# Container PaaS (Render/Railway) typically inject their own PORT.
ENV PORT=8000
EXPOSE 8000

# Create non-root user for security
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user

# Health check — uses $PORT so it works on any PaaS
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the application: deploy migrations then start the server
CMD npx prisma migrate deploy && node index.js
