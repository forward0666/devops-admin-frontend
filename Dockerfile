FROM node:20-alpine AS builder

WORKDIR /app
COPY . .
RUN npm ci --legacy-peer-deps 2>&1 | tail -3 && \
    npm run build 2>&1 | tail -5

FROM nginx:alpine
COPY --from=builder /app/.output/public /usr/share/nginx/html
COPY --from=builder /app/.output/server /app/server

# nginx 配置
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 8080;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://192.168.86.12:32101/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]