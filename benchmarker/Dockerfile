# k6インストール専用ステージ
FROM grafana/k6:0.51.0-with-browser AS k6


# 開発用実行ステージ
FROM node:20.14.0-alpine AS development

WORKDIR /usr/src/benchmarker

RUN apk add --no-cache curl jq chromium bash

ENV K6_BROWSER_ARGS="no-sandbox"

COPY --from=k6 /usr/bin/k6 /usr/bin/k6


# 本番用実行ステージ
FROM 42tokyo2407.azurecr.io/benchmarker:latest AS production

WORKDIR /usr/src/benchmarker

COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6 \
    yarn install --production --frozen-lockfile

ENV K6_BROWSER_ARGS="no-sandbox"

CMD ["node", "server.js"]

EXPOSE 4000
