#!/usr/bin/env bash
# Runs ON the EC2 server, as root. GitHub Actions sends it through
# SSM Run Command (see run-on-ec2.sh) with IMAGE_TAG set to the commit SHA.
set -euo pipefail
export PATH="$PATH:/snap/bin"

REGION="eu-north-1"
REGISTRY="203342792484.dkr.ecr.eu-north-1.amazonaws.com"
IMAGE="$REGISTRY/showroom-backend:${IMAGE_TAG:?IMAGE_TAG is required}"
ENV_DIR="/etc/showroom"
ENV_FILE="$ENV_DIR/backend.env"
CONTAINER="showroom-backend"

echo "==> Ensuring the AWS CLI is installed"
if ! command -v aws >/dev/null 2>&1; then
  snap install aws-cli --classic
fi

echo "==> Reading DATABASE_URL from Parameter Store"
install -d -m 700 "$ENV_DIR"
DATABASE_URL="$(aws ssm get-parameter --region "$REGION" \
  --name /showroom/database-url --with-decryption \
  --query Parameter.Value --output text)"
( umask 077; printf 'DATABASE_URL=%s\n' "$DATABASE_URL" > "$ENV_FILE" )

echo "==> Pulling $IMAGE"
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"
docker pull "$IMAGE"

echo "==> Applying database migrations"
docker run --rm --env-file "$ENV_FILE" "$IMAGE" alembic upgrade head

echo "==> Loading seed data (content lives in seed_data.json)"
docker run --rm --env-file "$ENV_FILE" "$IMAGE" python seed.py

echo "==> Restarting the API container"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" --restart unless-stopped \
  --env-file "$ENV_FILE" -p 8000:8000 "$IMAGE"

echo "==> Waiting for /api/health"
for attempt in $(seq 1 30); do
  if curl -fsS http://localhost:8000/api/health >/dev/null; then
    echo "API is healthy"
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    echo "API did not become healthy, last logs:"
    docker logs --tail 50 "$CONTAINER"
    exit 1
  fi
  sleep 2
done

echo "==> Removing stopped containers and images older than a week"
docker container prune -f
docker image prune -af --filter "until=168h"
