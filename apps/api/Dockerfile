FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config from root
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages and api app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared package FIRST before api
RUN pnpm --filter @lexiroot/shared build

# Then build the api
RUN pnpm --filter api build

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]