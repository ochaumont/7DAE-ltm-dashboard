#!/bin/sh
set -e
NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1 node /app/server.js &
exec nginx -g 'daemon off;'
