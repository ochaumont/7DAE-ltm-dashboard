FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache nodejs

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-custom.conf /etc/nginx/templates/default.conf.template
COPY app/start.sh /app/start.sh
RUN chmod +x /app/start.sh

COPY --from=builder --chown=101:101 /app/public /app/public
COPY --from=builder --chown=101:101 /app/.next/standalone /app
COPY --from=builder --chown=101:101 /app/.next/static /app/.next/static

USER 101
EXPOSE 8080
CMD ["/app/start.sh"]
