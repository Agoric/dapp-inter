FROM ghcr.io/agoric/agoric-sdk:45

# Add the Agoric CLI to the PATH to access 'agops' from the shell.
ENV PATH="/usr/src/agoric-sdk/packages/agoric-cli/bin:${PATH}"
# Prefer IPv4 for DNS resolution
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Install necessary dependencies
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates jq xvfb

# Install Chromium
RUN apt-get install chromium-browser

# Setup Nginx
RUN apt update && apt install -y nginx
COPY test/e2e/nginx.conf /etc/nginx/sites-available/default

# Setup Dapp-Inter
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
