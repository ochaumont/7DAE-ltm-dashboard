FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ARG BASE_HREF=""
ENV BASE_HREF=${BASE_HREF}
RUN npm run build

FROM nginx:1.27-alpine
ENV SERVER_PORT=8080
ENV BASE_HREF=/

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/out/ /usr/share/nginx/html/

RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx \
    && touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid
USER app

EXPOSE 8080
CMD ["/bin/sh", "-c", "sed -i -e 's/$SERVER_PORT/'\"$SERVER_PORT\"'/g' /etc/nginx/conf.d/default.conf && sed -i -e 's#$BASE_HREF#'\"$BASE_HREF\"'#g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
