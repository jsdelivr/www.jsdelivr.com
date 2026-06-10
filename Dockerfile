FROM node:24-slim AS build

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY patches ./patches

RUN npm ci

COPY .babelrc .browserslistrc elastic-apm-node.js gulpfile.js ./
COPY config ./config
COPY data ./data
COPY fonts ./fonts
COPY src ./src

RUN npm run build \
	&& npm prune --omit=dev \
	&& npm cache clean --force

FROM node:24-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
	ELASTIC_APM_CONFIG_FILE=elastic-apm-node.js

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json /app/elastic-apm-node.js ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/config ./config
COPY --from=build --chown=node:node /app/data ./data
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/fonts ./fonts
COPY --from=build --chown=node:node /app/src ./src

USER node

EXPOSE 4400

CMD [ "node", "src" ]
