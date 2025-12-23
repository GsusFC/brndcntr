FROM node:20-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install turbo --global
COPY . .
RUN turbo prune landing --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=builder /app/out/full/ .

ARG INDEXER_DATABASE_URL
ENV INDEXER_DATABASE_URL=${INDEXER_DATABASE_URL}
ARG NEXT_PUBLIC_REOWN_PROJECT_ID
ENV NEXT_PUBLIC_REOWN_PROJECT_ID=${NEXT_PUBLIC_REOWN_PROJECT_ID}

RUN npx turbo run build --filter=landing

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/landing/next.config.ts .
COPY --from=installer /app/apps/landing/package.json .

COPY --from=installer --chown=nextjs:nodejs /app/apps/landing/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/landing/public ./apps/landing/public

CMD ["node", "apps/landing/server.js"]
