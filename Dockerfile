# syntax=docker/dockerfile:1

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5173
ENV CYRI_DATA_DIR=/app/data

WORKDIR /app

# The app has no runtime npm dependencies. Keep the image small and only copy
# the files needed by the Node server and the public frontend.
COPY --chown=node:node package.json server.js app.js index.html styles.css \
  robots.txt sitemap.xml site.webmanifest favicon.ico favicon.png \
  apple-touch-icon.png ./
COPY --chown=node:node assets ./assets
COPY --chown=node:node content ./content

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 5173
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5173) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
