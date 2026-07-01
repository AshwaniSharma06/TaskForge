# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl and compatibility libraries for Prisma engine binary
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production Runtime Stage
FROM node:20-alpine

WORKDIR /app

# Install openssl and compatibility libraries for Prisma engine binary
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci --only=production

# Copy built code and database files
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Generate Prisma client for the production dependencies
RUN npx prisma generate

# Expose backend API port
EXPOSE 5000

# Set production environment defaults
ENV PORT=5000
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/prisma/dev.db"

# Apply migrations and run the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
