FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile

# Use local typescript binary from shared's node_modules
RUN cd packages/shared && ./node_modules/.bin/tsc

RUN pnpm --filter api build

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]