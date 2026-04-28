FROM oven/bun:1.3.11-alpine AS build
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
RUN bun install

COPY . .
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/public ./apps/server/public
COPY --from=build /app/apps/server/drizzle ./apps/server/drizzle
COPY --from=build /app/config ./config
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/server/package.json ./apps/server/package.json

RUN mkdir -p /app/data

EXPOSE 3000
WORKDIR /app/apps/server
CMD ["node", "dist/server.cjs"]
