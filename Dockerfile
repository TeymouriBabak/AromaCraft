FROM node:18-alpine AS deps
WORKDIR /usr/src/app

# Alpine: install minimal runtime deps needed by Prisma and OpenSSL
RUN apk add --no-cache openssl ca-certificates bash build-base python3 make g++ libc6-compat

# Copy lockfile and package manifests for reproducible installs
COPY package*.json ./

# Install all dependencies (including dev) so native optional binaries are available
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Ensure build tools and certificates are present for generating Prisma client
RUN apk add --no-cache openssl ca-certificates bash build-base python3 make g++ libc6-compat

# Copy node_modules from deps stage to retain installed binaries
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy application source
COPY . .

# Provide a temporary DATABASE_URL during build so Prisma can generate engines
ENV DATABASE_URL="mysql://prisma:prisma@127.0.0.1:3306/aromacraft"
# Generate Prisma client if present, then build the app
# Ensure Prisma client is generated for the linux runtime inside the builder
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install OpenSSL required by Prisma query engine, then create a non-root user
RUN apk add --no-cache openssl ca-certificates bash libc6-compat || true
RUN addgroup -S appuser && adduser -S -G appuser appuser || true

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
