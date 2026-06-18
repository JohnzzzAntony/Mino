# ---- Build Stage ----
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Generate Prisma client (does NOT need DATABASE_URL)
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy all source and build Next.js
COPY . .
RUN bun run next build
# ^ This runs: next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
# The cp commands are already in the package.json build script, so standalone has everything

# ---- Production Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the fully self-contained standalone output (already includes public/ and .next/static/)
COPY --from=builder /app/.next/standalone ./

EXPOSE 3000

CMD ["node", "server.js"]
