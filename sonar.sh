#!/usr/bin/env bash
# Builds the app and pushes a SonarQube analysis to a local SonarQube instance
# (e.g. `docker run -d -p 9000:9000 sonarqube:latest`).
#
# Usage:
#   export SONAR_TOKEN=squ_xxxxxxxx   # generate one in SonarQube > My Account > Security
#   ./sonar.sh
#
# Optional:
#   SONAR_HOST_URL   defaults to http://localhost:9000

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

export SONAR_HOST_URL="${SONAR_HOST_URL:-http://localhost:9000}"

if [ -z "${SONAR_TOKEN:-}" ]; then
  echo "Error: SONAR_TOKEN is not set." >&2
  echo "Generate a token in SonarQube (My Account > Security) and export it:" >&2
  echo "  export SONAR_TOKEN=squ_xxxxxxxx" >&2
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building the app"
npm run build

echo "==> Running SonarQube scan against ${SONAR_HOST_URL}"
npx --yes sonarqube-scanner

echo "==> Done. View the analysis at ${SONAR_HOST_URL}/dashboard?id=$(grep '^sonar.projectKey=' sonar-project.properties | cut -d= -f2)"
