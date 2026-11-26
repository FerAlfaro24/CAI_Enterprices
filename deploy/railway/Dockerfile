FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY shared ./shared
COPY server ./server
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
# Constantes privadas que importa el backend; nunca se sirven desde el proxy.
COPY --from=build /app/src/features/admin/data/mockData.ts ./src/features/admin/data/mockData.ts
COPY --from=build /app/src/features/landing/data/content.ts ./src/features/landing/data/content.ts
ENV NODE_ENV=production CAI_DATA_DIR=/data CAI_TRUST_PROXY=loopback CAI_API_PORT=3100
ENV UV_THREADPOOL_SIZE=2 NODE_OPTIONS=--max-old-space-size=192
CMD ["node", "server/railway-start.ts"]
