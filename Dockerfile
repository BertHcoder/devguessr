# syntax=docker/dockerfile:1

# ---- Build stage: install all deps and compile server + client ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# Copy the rest of the source and build both workspaces.
COPY . .
RUN npm run build

# ---- Runtime stage: production deps + built artifacts only ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies.
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --omit=dev

# Copy the compiled output. The server resolves the client build at
# ../../client/dist relative to server/dist, so keep this layout intact.
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
