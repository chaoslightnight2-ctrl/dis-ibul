FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates dumb-init openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
ENV NODE_ENV=production
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    REDIS_URL=redis://127.0.0.1:6379 \
    BETTER_AUTH_SECRET=build-only-placeholder-value-123456789 \
    APP_BASE_URL=https://build.invalid \
    BETTER_AUTH_URL=https://build.invalid \
    AUTH_ALLOWED_HOSTS=build.invalid \
    sh -c 'npx prisma generate && npm run build'

FROM builder AS prod-deps
RUN npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    RUN_MIGRATIONS=true

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh /usr/local/bin/discibul-entrypoint
RUN chmod +x /usr/local/bin/discibul-entrypoint

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "discibul-entrypoint"]
