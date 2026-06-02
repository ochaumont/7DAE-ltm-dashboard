FROM docker-airbus-virtual.artifactory.2b82.aws.cloud.airbus.corp/nginx:1.27-alpine

RUN apk add --no-cache nodejs

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-custom.conf /etc/nginx/templates/default.conf.template
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

COPY --chown=101:101 public /app/public
COPY --chown=101:101 .next/standalone /app
COPY --chown=101:101 .next/static /app/.next/static

USER 101
EXPOSE 8080
CMD ["/app/start.sh"]
