FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app

# Debian base avoids the Alpine package-manager TLS failures seen in this environment
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates bash build-essential python3 make g++ libc6 && \
    rm -rf /var/lib/apt/lists/*

# Copy lockfile and package manifests for reproducible installs
COPY package*.json ./

# Install all dependencies (including dev) so native optional binaries are available
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /usr/src/app

# Ensure build tools and certificates are present for generating Prisma client
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates bash build-essential python3 make g++ libc6 && \
    rm -rf /var/lib/apt/lists/*

# Copy node_modules from deps stage to retain installed binaries
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy application source
COPY . .

# Provide a temporary DATABASE_URL during build so Prisma can generate engines
ENV DATABASE_URL="mysql://prisma:prisma@127.0.0.1:3306/aromacraft"
# Generate Prisma client if present, then build the app
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install OpenSSL required by Prisma query engine, then create a non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates bash libc6 && \
    rm -rf /var/lib/apt/lists/* \
    && groupadd --system appuser && useradd --system --gid appuser appuser || true

# Copy only production package metadata and install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output and runtime assets from builder
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src/generated/prisma ./src/generated/prisma
COPY --from=builder /usr/src/app/package.json ./package.json

# Ensure correct ownership and minimal permissions
RUN chown -R appuser:appuser /usr/src/app && chmod -R 0755 /usr/src/app
USER appuser

EXPOSE 3000
CMD ["npm", "start"]
