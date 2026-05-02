FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
WORKDIR /app/packages/backend
RUN pnpm build

# Install chromium for puppeteer
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates

# Set environment
ENV NODE_ENV=production
ENV PORT=4000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 4000

# Run
CMD ["node", "dist/index.js"]