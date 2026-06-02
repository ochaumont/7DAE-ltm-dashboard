FROM docker-airbus-virtual.artifactory.2b82.aws.cloud.airbus.corp/nginx:1.27-alpine

RUN apk add --no-cache nodejs

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-custom.conf /etc/nginx/templates/default.conf.template
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Dans l'architecture Next.js Standalone, l'exécutable server.js s'attend 
# à trouver 'public' et '.next/static' directement dans son propre répertoire.
# Le Jenkinsfile va extraire tout le contenu directement à la racine '/app'
COPY --chown=101:101 . /app

USER 101
EXPOSE 8080
CMD ["/app/start.sh"]