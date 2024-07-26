# ベースステージ
FROM rust:1.77.2-alpine AS base

WORKDIR /usr/src/backend

RUN apk add --no-cache musl-dev libgcc openssl-dev curl imagemagick bash

# sccacheのインストール
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
    SCCACHE_URL="https://github.com/mozilla/sccache/releases/download/v0.8.1/sccache-v0.8.1-x86_64-unknown-linux-musl.tar.gz"; \
    elif [ "$ARCH" = "aarch64" ]; then \
    SCCACHE_URL="https://github.com/mozilla/sccache/releases/download/v0.8.1/sccache-v0.8.1-aarch64-unknown-linux-musl.tar.gz"; \
    else \
    echo "Unsupported architecture: $ARCH"; exit 1; \
    fi && \
    curl -o /tmp/sccache.tgz -L $SCCACHE_URL && \
    tar xf /tmp/sccache.tgz -C /tmp && \
    mv /tmp/sccache*/sccache /usr/local/bin && \
    rm -rf /tmp/sccache*

ENV RUST_BACKTRACE=1
ENV CARGO_HOME=/var/cache/cargo
ENV SCCACHE_DIR=/var/cache/sccache

# 開発用ステージ
FROM base AS development

WORKDIR /usr/src/backend

COPY ./Cargo.toml ./Cargo.lock ./
COPY ./images ../images

RUN mkdir src \
    && echo "fn main() {}" > src/main.rs

RUN --mount=type=cache,target=/var/cache/cargo --mount=type=cache,target=/var/cache/sccache \
    cargo fetch --locked

RUN cargo install cargo-watch


# ビルドステージ
FROM 42tokyo2407.azurecr.io/backend:base AS build

WORKDIR /usr/src/backend

COPY ./ ./

RUN --mount=type=cache,target=/var/cache/cargo --mount=type=cache,target=/var/cache/sccache \
    cargo build --release


# 本番用ステージ
FROM 42tokyo2407.azurecr.io/backend:base AS production

WORKDIR /usr/local/bin

COPY --from=build /usr/src/backend/target/release/backend ./
COPY --from=build /usr/src/backend/images /usr/local/bin/images

EXPOSE 8080