FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DB_PATH=/var/lib/just-a-space/cafe.sqlite PUBLIC_LAUNCH=0
COPY --chown=node:node package.json package-lock.json server.mjs ./
COPY --chown=node:node cms ./cms
COPY --chown=node:node config ./config
COPY --chown=node:node lib ./lib
COPY --chown=node:node ops ./ops
COPY --chown=node:node web ./web
RUN mkdir -p /var/lib/just-a-space && chown node:node /var/lib/just-a-space && chmod 700 /var/lib/just-a-space
USER node
EXPOSE 3000
VOLUME ["/var/lib/just-a-space"]
CMD ["node","server.mjs"]
