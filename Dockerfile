# Angular 19 — Node LTS for a reliable CLI build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Yarn classic (lockfile v1) — matches repo yarn.lock; avoids npm ci / package-lock drift
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:1.27-alpine AS runner

COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ticketing-system-client/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
