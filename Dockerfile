FROM docker-airbus-virtual.artifactory.2b82.aws.cloud.airbus.corp/nginx:1.27-alpine

COPY deployment/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deployment/nginx/nginx-custom.conf /etc/nginx/templates/default.conf.template

# Change the target directory to match your subpath
COPY --chown=101:101 out /usr/share/nginx/html/atom-ltm-dashboard

USER 101
EXPOSE 8080
