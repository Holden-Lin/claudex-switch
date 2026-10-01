# Both images are pulled by immutable digest before the offline test container
# starts. The upstream image is the official OpenCode v2.0.6 Linux image.
FROM ghcr.io/anomalyco/opencode:2.0.6@sha256:216ad0031f35d39ac7cfe4eb056af5d33c3647f4946641735c579902ecead737 AS opencode
FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd

# OpenCode's image supplies its pinned musl CLI and ripgrep; the official Node
# image supplies Node plus libstdc++/libgcc before the test is network-isolated.
COPY --from=opencode /usr/local/bin/opencode /usr/local/bin/opencode
COPY --from=opencode /usr/bin/rg /usr/bin/rg

ENV OPENCODE_BIN=/usr/local/bin/opencode
WORKDIR /workspace
USER node
