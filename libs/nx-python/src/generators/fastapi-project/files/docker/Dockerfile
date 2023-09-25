# syntax=docker/dockerfile:1

# Base image for building services with Python, Poetry and NX
# We need both PNPM and Poetry for the build process since the nx executors internally call poetry commands
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

ENV PNPM_HOME=/usr/local/bin \
  PATH="$PATH:$PNPM_HOME" \
  NX_VERSION=16.3.2 \
  PYTHON_VERSION=3.11.5-r0 \
  PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing PNPM"
RUN id=pnpm-store,target=/root/.pnpm-store npm install -g pnpm

RUN echo "Installing NX version $NX_VERSION"
RUN pnpm add -g nx@$NX_VERSION

RUN echo "Installing python version $PYTHON_VERSION"
RUN apk add --no-cache python3=$PYTHON_VERSION py3-pip

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing poetry version $POETRY_VERSION"
RUN pip3 install "poetry==$POETRY_VERSION"


# Base image for service runner
# We don't need NX for running the service, so might as well leave it out
FROM python:3.10-slim-bookworm as runner-base

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.5.1

RUN echo "Installing poetry version $POETRY_VERSION"
RUN pip install "poetry==$POETRY_VERSION"


# Prune monorepo to only include the service/libs we want to build
# Decreases final image size drastically the bigger the monorepo becomes
FROM base AS prune
WORKDIR /app

ENV NX_PYTHON_POETRY_SERVICE="<%= projectName %>"

COPY . .

RUN echo "Pruning monorepo"
RUN python tools/docker/prune_monorepo.py


# Install NX dependencies and build the artifacts for the service
# Building the actual artefacts is handeled by the NX executor (see `libs/nx-python/executors/build`)
FROM base AS builder
WORKDIR /app

COPY --from=prune /app/out .

RUN echo "Installing NX dependencies"
RUN pnpm install --frozen-lockfile

RUN echo "Building artifacts"
RUN nx run <%= projectName %>:build

RUN echo "Unpacking artifacts"
RUN mkdir -p /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0
RUN tar -xzf /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0.tar.gz -C /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 --strip-components=1

RUN mv /app/services/<%= projectName %>/dist/<%= moduleName %>-0.0.0 /app/services/<%= projectName %>/dist/<%= moduleName %>


# Finally run the service, use base image for runner here since we don't need NX anymore
FROM runner-base AS runner
WORKDIR /app

COPY --from=builder /app/services/<%= projectName %>/dist/<%= moduleName %> .

RUN echo "Installing Python dependencies"
RUN poetry config virtualenvs.create false
RUN poetry install --without=dev --no-interaction --no-ansi

RUN groupadd -g 999 appuser
RUN useradd -r -u 999 -g appuser appuser
USER appuser

CMD ["uvicorn", "<%= moduleName %>.main:app", "--host", "<%= host %>", "--port", "<%= port %>"]