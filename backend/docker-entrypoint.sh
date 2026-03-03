#!/bin/sh
set -e


echo "Entrypoint: waiting for database and initializing Prisma..."

if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL is set"
else
  echo "WARNING: DATABASE_URL is NOT set"
fi

RETRY=0
MAX_RETRY=120
while true; do
  echo "Attempting database connectivity check (try=$RETRY)"
  if npx prisma migrate deploy 2>&1 | head -1; then
    echo "Database is reachable"
    break
  fi
  RETRY=$((RETRY+1))
  if [ "$RETRY" -ge "$MAX_RETRY" ]; then
    echo "Timed out waiting for database"
    exit 1
  fi
  echo "Waiting for database... (retries=$RETRY)"
  sleep 2
done

echo "Database reachable — generating Prisma client"
npx prisma generate

echo "Applying migrations"
npx prisma migrate deploy || true

echo "Building backend application"
npm run build

if [ -f prisma/seed.ts ]; then
  echo "Running seed script"
  # try running seed with ts-node register
  node -e "require('ts-node').register(); require('./prisma/seed')" || true
fi

echo "Starting server"
npm run start
