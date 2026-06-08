FROM docker-airbus-virtual.artifactory.2b82.aws.cloud.airbus.corp/nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-custom.conf /etc/nginx/templates/default.conf.template

# Runtime config generator: writes window.__ENV__ (Basic auth) at container start
# from ATOM_API_USERNAME/ATOM_API_PASSWORD. Runs via the stock nginx entrypoint.
COPY docker/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

COPY --chown=101:101 out /usr/share/nginx/html

USER 101
EXPOSE 8080
