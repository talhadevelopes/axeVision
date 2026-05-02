FROM node:20-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/backend
RUN DATABASE_URL="mongodb://localhost:27017/build" pnpm build

# Install chromium for puppeteer
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates
ENV NODE_ENV=production
ENV PORT=4000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 4000
CMD ["node", "dist/index.js"]