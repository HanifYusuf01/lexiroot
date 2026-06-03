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

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build shared package using local tsc
RUN cd packages/shared && npx tsc

# Then build the api
RUN pnpm --filter api build

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]