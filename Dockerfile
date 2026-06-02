# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

# Stage 2b: Isolated migration toolchain — the prisma CLI closure ONLY (no app deps).
# A dedicated `npm install` computes the FULL, correct dependency closure of the
# CLI (the Prisma 7 CLI eagerly loads @prisma/dev + @prisma/studio-core, which pull
# a deep tree — pglite, hono, effect, c12, …). This keeps /app/migrate-tools small
# without hand-picking transitives, and isolated from the app's node_modules.
# Pinned to the project's exact prisma version (read from the installed deps).
FROM node:20-slim AS migrate-tools
WORKDIR /migrate-tools
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules/prisma/package.json /tmp/prisma-pkg.json
RUN PV=$(node -p "require('/tmp/prisma-pkg.json').version") \
 && npm init -y >/dev/null \
 && npm install --no-audit --no-fund "prisma@$PV" "@prisma/config@$PV" dotenv \
 && rm -f /tmp/prisma-pkg.json
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY migrate-tools/predeploy.sh ./predeploy.sh
RUN chmod +x ./predeploy.sh

# Stage 3: Production image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install runtime dependencies (OpenSSL for Prisma, FFmpeg for video, Chromium deps for Playwright)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ffmpeg \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright Chromium
RUN npx playwright install chromium

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (uploads directory will be mounted as a volume)
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Isolated migration toolchain for the preDeployCommand (`migrate deploy`).
# Comes from the dedicated `migrate-tools` stage (the prisma CLI closure + schema
# + config) — its OWN node_modules, NEVER touching /app/node_modules or the
# .next/standalone tree, so it cannot corrupt the app runtime (the #118 failure
# mode). The CLI resolves its deps from /app/migrate-tools/node_modules via node
# resolution when invoked with cwd there.
COPY --from=migrate-tools --chown=nextjs:nodejs /migrate-tools /app/migrate-tools

RUN mkdir -p /app/public/uploads

EXPOSE 3000

CMD ["node", "server.js"]
