FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile

RUN cd packages/shared && ./node_modules/.bin/tsc

RUN pnpm --filter api build

EXPOSE 3000

CMD ["sh", "-c", "node /app/apps/api/dist/database/migrate.js && node /app/apps/api/dist/main.js"]