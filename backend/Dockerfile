FROM node:18-bullseye-slim
WORKDIR /app

# Install system deps required by Prisma and runtime
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		ca-certificates \
		openssl \
		libstdc++6 \
		libssl1.1 \
		zlib1g \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# Install all dependencies (including dev) because entrypoint uses prisma & ts-node for migrations/seeding
RUN npm install
COPY . .
# Don't build yet - Prisma client needs to be generated first in entrypoint
RUN chmod +x ./docker-entrypoint.sh || true
EXPOSE 4000
ENTRYPOINT ["/bin/sh","./docker-entrypoint.sh"]
