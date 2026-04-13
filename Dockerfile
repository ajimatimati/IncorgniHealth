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

# Expose huggingface default port
EXPOSE 7860

# Create non-root user for security
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:7860/health || exit 1

# Start the application: deploy migrations then start the server
CMD npx prisma migrate deploy && node index.js
