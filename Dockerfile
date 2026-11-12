FROM node:22-alpine
WORKDIR /app
COPY server.js resume.html ./
ENV PORT=80
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/healthz || exit 1
CMD ["node", "server.js"]
