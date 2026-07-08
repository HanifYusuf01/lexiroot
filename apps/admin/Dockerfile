FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @lexiroot/admin build

FROM nginx:alpine

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# SPA fallback + cache policy (immutable hashed assets, always-revalidate HTML).
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Fail the build rather than ship a container that won't start on a typo.
RUN nginx -t

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]