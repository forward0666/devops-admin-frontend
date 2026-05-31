FROM node:24-alpine AS build-stage

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY typescript-version/package.json ./typescript-version/

RUN pnpm config set onlyBuiltDependencies '' && pnpm install

COPY . .

RUN cd typescript-version && pnpm generate

FROM nginx:1.30.1

RUN mkdir -p /www/wwwroot /var/run/nginx /var/cache/nginx

COPY --from=build-stage /app/typescript-version/.output/public/ /www/wwwroot/

RUN chown -R nginx:nginx /www/wwwroot \
 && chown -R nginx:nginx /var/cache/nginx \
 && chown -R nginx:nginx /var/run/ \
 && apt-get update && apt-get install -y libcap2-bin \
 && setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

USER nginx

EXPOSE 80

