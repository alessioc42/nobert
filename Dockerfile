# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies into a temp directory for caching
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies only
RUN mkdir -p /temp/prod
COPY package.json bun.lock* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy source and installed dependencies
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Final production image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/tsconfig.json .

# Create database directory
RUN mkdir -p /app/database

ENTRYPOINT ["bun", "run", "src/main.ts"]
